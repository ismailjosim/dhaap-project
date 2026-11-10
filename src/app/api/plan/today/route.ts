import { NextResponse } from "next/server";
import { generateDayPlan } from "@/core/scheduler";
import type { TopicItemInput } from "@/core/types";
import { connectDB } from "@/lib/db";
import { DayPlan, Roadmap, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";
import { getOrCreateUserSettings } from "@/lib/settings";

function getTodayDateString(timezone = "Asia/Dhaka"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export async function GET(_req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const settings = await getOrCreateUserSettings(user.id);
  const todayStr = getTodayDateString(settings.timezone);

  // 1. Check if plan already exists for today
  let plan = await DayPlan.findOne({ userId: user.id, date: todayStr });

  if (plan) {
    return NextResponse.json({ plan, settings, date: todayStr });
  }

  // 2. Lazy generation: Gather data for scheduler
  const activeRoadmap = await Roadmap.findOne({
    userId: user.id,
    isActive: true,
  });
  if (!activeRoadmap) {
    return NextResponse.json({
      plan: null,
      settings,
      date: todayStr,
      message:
        "No active roadmap found. Create a roadmap to generate your daily plan.",
    });
  }

  const todayDateObj = new Date(todayStr);

  const [needsRecapTopics, dueReviewTopics, upcomingTopics, yesterdayPlan] =
    await Promise.all([
      Topic.find({ roadmapId: activeRoadmap._id, status: "NEEDS_RECAP" }).sort({
        updatedAt: 1,
      }),
      Topic.find({
        roadmapId: activeRoadmap._id,
        status: "REVIEWING",
        nextReviewAt: { $lte: todayDateObj },
      }).sort({ nextReviewAt: 1 }),
      Topic.find({ roadmapId: activeRoadmap._id, status: "NOT_STARTED" }).sort({
        orderIndex: 1,
      }),
      DayPlan.findOne({ userId: user.id }).sort({ date: -1 }),
    ]);

  // Extract carry-overs: items from yesterday that were PLANNED but not DONE
  const carryOverTopics: Array<{
    topic: TopicItemInput;
    remainingMinutes?: number;
    carriedFromDate?: string;
  }> = [];

  if (yesterdayPlan && yesterdayPlan.date !== todayStr) {
    for (const item of yesterdayPlan.items) {
      if (item.status === "PLANNED" && item.type === "LEARN") {
        const topicDoc = await Topic.findById(item.topicId);
        if (
          topicDoc &&
          topicDoc.status !== "PASSED" &&
          topicDoc.status !== "MASTERED"
        ) {
          carryOverTopics.push({
            topic: {
              id: topicDoc._id.toString(),
              title: topicDoc.title,
              estimatedMinutes: topicDoc.estimatedMinutes,
              orderIndex: topicDoc.orderIndex,
              status: topicDoc.status,
              reviewStep: topicDoc.reviewStep,
              lapses: topicDoc.lapses,
            },
            remainingMinutes: item.plannedMinutes,
            carriedFromDate: item.carriedFromDate || yesterdayPlan.date,
          });
        }
      }
    }
  }

  const toInputTopic = (
    t: (typeof needsRecapTopics)[number],
  ): TopicItemInput => ({
    id: t._id.toString(),
    title: t.title,
    estimatedMinutes: t.estimatedMinutes,
    orderIndex: t.orderIndex,
    status: t.status,
    reviewStep: t.reviewStep,
    lapses: t.lapses,
    nextReviewAt: t.nextReviewAt,
  });

  const schedulerResult = generateDayPlan({
    dateStr: todayStr,
    settings: {
      dailyCapMinutes: settings.dailyCapMinutes,
      recapCapMinutes: settings.recapCapMinutes,
      restWeekdays: settings.restWeekdays,
      timezone: settings.timezone,
    },
    dueReviews: dueReviewTopics.map(toInputTopic),
    needsRecap: needsRecapTopics.map(toInputTopic),
    carryOverTopics,
    upcomingTopics: upcomingTopics.map(toInputTopic),
  });

  try {
    plan = await DayPlan.create({
      userId: user.id,
      date: todayStr,
      isRestDay: schedulerResult.isRestDay,
      items: schedulerResult.items,
    });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      plan = await DayPlan.findOne({ userId: user.id, date: todayStr });
    } else {
      throw err;
    }
  }

  return NextResponse.json({ plan, settings, date: todayStr });
}

export async function POST(req: Request) {
  // Regenerate today's plan
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const settings = await getOrCreateUserSettings(user.id);
  const todayStr = getTodayDateString(settings.timezone);

  // Remove current plan for today and re-trigger GET
  await DayPlan.deleteOne({ userId: user.id, date: todayStr });

  return GET(req);
}

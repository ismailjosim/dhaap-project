import { NextResponse } from "next/server";
import { generateDayPlan } from "@/core/scheduler";
import type { TopicItemInput } from "@/core/types";
import { connectDB } from "@/lib/db";
import { DayPlan, Roadmap, Topic, UserSettings } from "@/lib/models";

function getTomorrowDateString(timezone = "Asia/Dhaka"): string {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(tomorrow);
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");

  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    secretParam !== cronSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const allSettings = await UserSettings.find({}).lean();
  let generatedCount = 0;

  for (const settings of allSettings) {
    const tomorrowStr = getTomorrowDateString(settings.timezone);

    // Check if tomorrow's plan already exists
    const existing = await DayPlan.findOne({
      userId: settings.userId,
      date: tomorrowStr,
    });
    if (existing) continue;

    const activeRoadmap = await Roadmap.findOne({
      userId: settings.userId,
      isActive: true,
    });
    if (!activeRoadmap) continue;

    const targetDateObj = new Date(tomorrowStr);

    const [needsRecapTopics, dueReviewTopics, upcomingTopics, latestPlan] =
      await Promise.all([
        Topic.find({
          roadmapId: activeRoadmap._id,
          status: "NEEDS_RECAP",
        }).sort({ updatedAt: 1 }),
        Topic.find({
          roadmapId: activeRoadmap._id,
          status: "REVIEWING",
          nextReviewAt: { $lte: targetDateObj },
        }).sort({ nextReviewAt: 1 }),
        Topic.find({
          roadmapId: activeRoadmap._id,
          status: "NOT_STARTED",
        }).sort({ orderIndex: 1 }),
        DayPlan.findOne({ userId: settings.userId }).sort({ date: -1 }),
      ]);

    const carryOverTopics: Array<{
      topic: TopicItemInput;
      remainingMinutes?: number;
      carriedFromDate?: string;
    }> = [];

    if (latestPlan) {
      for (const item of latestPlan.items) {
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
              carriedFromDate: item.carriedFromDate || latestPlan.date,
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

    const result = generateDayPlan({
      dateStr: tomorrowStr,
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
      await DayPlan.create({
        userId: settings.userId,
        date: tomorrowStr,
        isRestDay: result.isRestDay,
        items: result.items,
      });
      generatedCount++;
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 11000) {
        console.error(
          `[Cron] Error creating plan for ${settings.userId}:`,
          err,
        );
      }
    }
  }

  return NextResponse.json({ success: true, plansGenerated: generatedCount });
}

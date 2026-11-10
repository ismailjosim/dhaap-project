import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Roadmap, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const roadmaps = await Roadmap.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  // Find active main roadmap
  const mainRoadmap =
    roadmaps.find((r) => r.isActive && r.roadmapType !== "SECONDARY") ||
    roadmaps.find((r) => r.roadmapType !== "SECONDARY") ||
    null;

  let topics: unknown[] = [];
  if (mainRoadmap) {
    topics = await Topic.find({ roadmapId: mainRoadmap._id })
      .sort({ orderIndex: 1 })
      .lean();
  }

  // Find secondary roadmaps
  const secondaryRoadmaps = roadmaps.filter(
    (r) => r.roadmapType === "SECONDARY",
  );
  const secondaryWithCounts = await Promise.all(
    secondaryRoadmaps.map(async (sr) => {
      const count = await Topic.countDocuments({ roadmapId: sr._id });
      const sampleTopics = await Topic.find({ roadmapId: sr._id })
        .sort({ orderIndex: 1 })
        .limit(5)
        .lean();
      return {
        ...sr,
        topicCount: count,
        sampleTopics,
      };
    }),
  );

  return NextResponse.json({
    roadmaps,
    activeRoadmap: mainRoadmap,
    topics,
    secondaryRoadmaps: secondaryWithCounts,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      title,
      goal,
      topics,
      roadmapType = "MAIN",
      durationMonths = 6,
      urgency = "MEDIUM",
      expectedStartDate,
      marketAnalysis,
      setAsActive,
    } = await req.json();

    if (!title || !goal) {
      return NextResponse.json(
        { error: "Title and goal are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const isMain = roadmapType === "MAIN";
    const shouldBeActive = isMain && setAsActive !== false;

    if (shouldBeActive) {
      // Deactivate other main roadmaps for this user
      await Roadmap.updateMany(
        { userId: user.id, roadmapType: "MAIN" },
        { $set: { isActive: false } },
      );
    }

    const roadmap = await Roadmap.create({
      userId: user.id,
      title,
      goal,
      roadmapType,
      durationMonths: Number(durationMonths) || 6,
      urgency,
      expectedStartDate: expectedStartDate || undefined,
      marketAnalysis: marketAnalysis || undefined,
      isActive: shouldBeActive,
      version: 1,
    });

    if (Array.isArray(topics) && topics.length > 0) {
      const topicDocs = topics.map((t, idx) => ({
        roadmapId: roadmap._id,
        userId: user.id,
        title: t.title,
        chapter: t.chapter || "Core Fundamentals",
        description: t.description || "",
        depthGuide: t.depthGuide || "",
        realWorldKnowledge: Array.isArray(t.realWorldKnowledge)
          ? t.realWorldKnowledge
          : [],
        keyInterviewQuestions: Array.isArray(t.keyInterviewQuestions)
          ? t.keyInterviewQuestions
          : [],
        orderIndex: t.orderIndex ?? idx,
        estimatedMinutes: t.estimatedMinutes || 90,
        status: "NOT_STARTED",
        reviewStep: 0,
        lapses: 0,
        isUrgent: urgency === "HIGH" || Boolean(t.isUrgent),
      }));

      await Topic.insertMany(topicDocs);
    }

    const createdTopics = await Topic.find({ roadmapId: roadmap._id }).sort({
      orderIndex: 1,
    });

    return NextResponse.json(
      { roadmap, topics: createdTopics },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CreateRoadmap] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create roadmap" },
      { status: 500 },
    );
  }
}

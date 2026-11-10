import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Roadmap, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { secondaryRoadmapId, action = "SET_AS_ACTIVE" } = await req.json();

    if (!secondaryRoadmapId) {
      return NextResponse.json(
        { error: "secondaryRoadmapId is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const secondaryRoadmap = await Roadmap.findOne({
      _id: secondaryRoadmapId,
      userId: user.id,
    });

    if (!secondaryRoadmap) {
      return NextResponse.json(
        { error: "Secondary roadmap not found" },
        { status: 404 },
      );
    }

    if (action === "SET_AS_ACTIVE") {
      // Deactivate other roadmaps
      await Roadmap.updateMany(
        { userId: user.id },
        { $set: { isActive: false } },
      );

      // Make this roadmap MAIN and ACTIVE
      secondaryRoadmap.roadmapType = "MAIN";
      secondaryRoadmap.isActive = true;
      await secondaryRoadmap.save();

      return NextResponse.json({
        success: true,
        roadmap: secondaryRoadmap,
        message: `"${secondaryRoadmap.title}" is now your active Main Roadmap!`,
      });
    }

    if (action === "APPEND_TO_MAIN") {
      // Find current active main roadmap
      const activeMain = await Roadmap.findOne({
        userId: user.id,
        isActive: true,
        roadmapType: "MAIN",
      });

      if (!activeMain) {
        // Just make it the active main
        secondaryRoadmap.roadmapType = "MAIN";
        secondaryRoadmap.isActive = true;
        await secondaryRoadmap.save();
        return NextResponse.json({ success: true, roadmap: secondaryRoadmap });
      }

      // Find max order index of active main
      const lastTopic = await Topic.findOne({ roadmapId: activeMain._id })
        .sort({ orderIndex: -1 })
        .lean();
      let nextOrder = lastTopic ? lastTopic.orderIndex + 1 : 0;

      // Move topics from secondary to active main
      const secondaryTopics = await Topic.find({
        roadmapId: secondaryRoadmap._id,
      }).sort({ orderIndex: 1 });

      for (const topic of secondaryTopics) {
        topic.roadmapId = activeMain._id as typeof topic.roadmapId;
        topic.orderIndex = nextOrder++;
        await topic.save();
      }

      // Delete the secondary roadmap record since topics were merged
      await Roadmap.deleteOne({ _id: secondaryRoadmap._id });

      return NextResponse.json({
        success: true,
        message: `Appended ${secondaryTopics.length} topics to your Main Roadmap.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[PromoteRoadmap] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to promote roadmap" },
      { status: 500 },
    );
  }
}

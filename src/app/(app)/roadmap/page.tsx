import { redirect } from "next/navigation";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { connectDB } from "@/lib/db";
import { Roadmap, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export const metadata = {
  title: "Roadmap — Dhaap",
  description: "View and manage your lifelong learning engineering roadmap.",
};

export default async function RoadmapPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const allRoadmaps = await Roadmap.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  const activeRoadmap =
    allRoadmaps.find((r) => r.isActive && r.roadmapType !== "SECONDARY") ||
    allRoadmaps.find((r) => r.roadmapType !== "SECONDARY") ||
    null;

  let topics: unknown[] = [];
  if (activeRoadmap) {
    topics = await Topic.find({ roadmapId: activeRoadmap._id })
      .sort({ orderIndex: 1 })
      .lean();
  }

  // Fetch secondary roadmaps with topic counts
  const secondaryRoadmaps = allRoadmaps.filter(
    (r) => r.roadmapType === "SECONDARY",
  );
  const secondaryWithDetails = await Promise.all(
    secondaryRoadmaps.map(async (sr) => {
      const count = await Topic.countDocuments({ roadmapId: sr._id });
      const sampleTopics = await Topic.find({ roadmapId: sr._id })
        .sort({ orderIndex: 1 })
        .limit(6)
        .lean();
      return {
        ...sr,
        topicCount: count,
        sampleTopics,
      };
    }),
  );

  const serializedRoadmaps = JSON.parse(JSON.stringify(allRoadmaps));
  const serializedActive = activeRoadmap
    ? JSON.parse(JSON.stringify(activeRoadmap))
    : null;
  const serializedTopics = JSON.parse(JSON.stringify(topics));
  const serializedSecondary = JSON.parse(JSON.stringify(secondaryWithDetails));

  return (
    <RoadmapView
      initialRoadmap={serializedActive}
      initialTopics={serializedTopics}
      allRoadmaps={serializedRoadmaps}
      initialSecondaryRoadmaps={serializedSecondary}
    />
  );
}

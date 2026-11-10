import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attempt, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch topics and attempts from the last 7 days
  const [recentAttempts, dueTopics, recapTopics] = await Promise.all([
    Attempt.find({ userId: user.id, createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: -1 })
      .lean(),
    Topic.find({
      userId: user.id,
      status: "REVIEWING",
      nextReviewAt: { $lte: new Date() },
    }).lean(),
    Topic.find({ userId: user.id, status: "NEEDS_RECAP" }).lean(),
  ]);

  const attemptedTopicIds = Array.from(
    new Set(recentAttempts.map((a) => a.topicId.toString())),
  );
  const studiedTopics = await Topic.find({
    _id: { $in: attemptedTopicIds },
  }).lean();

  const passedCount = recentAttempts.filter((a) => a.passed).length;
  const failedCount = recentAttempts.filter((a) => !a.passed).length;

  return NextResponse.json({
    summary: {
      totalAttempts: recentAttempts.length,
      passedCount,
      failedCount,
      studiedTopicsCount: studiedTopics.length,
      dueReviewsCount: dueTopics.length,
      recapBacklogCount: recapTopics.length,
    },
    studiedTopics,
    dueTopics,
    recapTopics,
    recentAttempts,
  });
}

import { redirect } from "next/navigation";
import { WeeklyReviewView } from "@/components/review/weekly-review-view";
import { connectDB } from "@/lib/db";
import { Attempt, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export const metadata = {
  title: "Weekly Review — Dhaap",
  description:
    "Weekly review of studied topics, recall accuracy, retention pipeline, and recap backlog.",
};

export default async function ReviewPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [recentAttempts, sixtyDayAttempts, allTopics, dueTopics, recapTopics] =
    await Promise.all([
      Attempt.find({ userId: user.id, createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .lean(),
      Attempt.find({ userId: user.id, createdAt: { $gte: sixtyDaysAgo } })
        .sort({ createdAt: 1 })
        .lean(),
      Topic.find({ userId: user.id }).lean(),
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
  const studiedTopics = allTopics.filter((t) =>
    attemptedTopicIds.includes(t._id.toString()),
  );

  const passedCount = recentAttempts.filter((a) => a.passed).length;
  const failedCount = recentAttempts.filter((a) => !a.passed).length;

  const summary = {
    totalAttempts: recentAttempts.length,
    passedCount,
    failedCount,
    studiedTopicsCount: studiedTopics.length,
    dueReviewsCount: dueTopics.length,
    recapBacklogCount: recapTopics.length,
  };

  return (
    <WeeklyReviewView
      summary={summary}
      studiedTopics={JSON.parse(JSON.stringify(studiedTopics))}
      dueTopics={JSON.parse(JSON.stringify(dueTopics))}
      recapTopics={JSON.parse(JSON.stringify(recapTopics))}
      recentAttempts={JSON.parse(JSON.stringify(recentAttempts))}
      allTopics={JSON.parse(JSON.stringify(allTopics))}
      sixtyDayAttempts={JSON.parse(JSON.stringify(sixtyDayAttempts))}
    />
  );
}

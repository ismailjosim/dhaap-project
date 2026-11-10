import { NextResponse } from "next/server";
import { calculateSpacedRepetition } from "@/core/spaced-repetition";
import { connectDB } from "@/lib/db";
import { Attempt, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { rating } = await req.json(); // "AGAIN" | "HARD" | "GOOD" | "EASY"

  if (!rating) {
    return NextResponse.json({ error: "Rating is required" }, { status: 400 });
  }

  await connectDB();

  const topic = await Topic.findOne({ _id: id, userId: user.id });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const isPassed = rating !== "AGAIN";

  // If "EASY", bump initial reviewStep so calculateSpacedRepetition advances an extra stage
  let inputStep = topic.reviewStep || 0;
  if (rating === "EASY") {
    inputStep = Math.min(5, inputStep + 1);
  }

  const result = calculateSpacedRepetition(
    {
      status: topic.status,
      reviewStep: inputStep,
      lapses: topic.lapses || 0,
    },
    isPassed,
  );

  // Update topic state
  topic.reviewStep = result.reviewStep;
  topic.status = result.status;
  topic.nextReviewAt = result.nextReviewAt ?? undefined;
  topic.lapses = result.lapses;
  topic.lastStudiedAt = new Date();
  await topic.save();

  // Record an attempt for streak & activity history
  const score =
    rating === "EASY"
      ? 100
      : rating === "GOOD"
        ? 85
        : rating === "HARD"
          ? 65
          : 40;

  await Attempt.create({
    topicId: topic._id,
    userId: user.id,
    score,
    passed: isPassed,
    inputMode: "flashcard",
    feedback: {
      conceptResults: [],
      misconceptions: !isPassed
        ? ["Required recall lapse during quick flashcard review."]
        : [],
      strengths: isPassed
        ? ["Quick recall self-validated in flashcard mode."]
        : [],
      improvements: [],
    },
  });

  const daysUntilNext = result.nextReviewAt
    ? Math.max(
        1,
        Math.round(
          (result.nextReviewAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return NextResponse.json({
    success: true,
    topic: {
      id: topic._id,
      reviewStep: topic.reviewStep,
      status: topic.status,
      nextReviewAt: topic.nextReviewAt,
    },
    message: isPassed
      ? result.mastered
        ? "Consolidated! Topic is now fully MASTERED."
        : `Consolidated! Next review in ${daysUntilNext} day(s).`
      : "Marked for recap. Interval reset to Day 1.",
  });
}

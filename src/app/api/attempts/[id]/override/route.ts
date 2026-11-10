import { NextResponse } from "next/server";
import { calculateScore } from "@/core/scoring";
import { calculateSpacedRepetition } from "@/core/spaced-repetition";
import type { ConceptEvaluation } from "@/core/types";
import { connectDB } from "@/lib/db";
import { Attempt, Question, Topic, UserSettings } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { conceptResults } = (await req.json()) as {
      conceptResults: ConceptEvaluation[];
    };

    if (!Array.isArray(conceptResults)) {
      return NextResponse.json(
        { error: "conceptResults array is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const attempt = await Attempt.findOne({ _id: id, userId: user.id });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const [question, topic, settings] = await Promise.all([
      Question.findById(attempt.questionId),
      Topic.findById(attempt.topicId),
      UserSettings.findOne({ userId: user.id }),
    ]);

    if (!question || !topic) {
      return NextResponse.json(
        { error: "Associated question or topic missing" },
        { status: 404 },
      );
    }

    const passScore = settings?.passScore ?? 70;

    // Recalculate score with updated concept results
    const scoreResult = calculateScore({
      rubric: question.rubric,
      evaluations: conceptResults,
      passScore,
    });

    // Update feedback conceptResults
    const feedback = attempt.feedback || {
      conceptResults: [],
      misconceptions: [],
      strengths: [],
      improvements: [],
    };
    feedback.conceptResults = conceptResults;

    attempt.overriddenScore = scoreResult.score;
    attempt.passed = scoreResult.passed;
    attempt.feedback = feedback;
    await attempt.save();

    // Recalculate spaced repetition for the topic
    const srResult = calculateSpacedRepetition(
      {
        status: topic.status,
        reviewStep: topic.reviewStep,
        lapses: topic.lapses,
      },
      scoreResult.passed,
    );

    topic.status = srResult.status;
    topic.reviewStep = srResult.reviewStep;
    topic.nextReviewAt = srResult.nextReviewAt || undefined;
    topic.masteryScore = scoreResult.score;
    await topic.save();

    return NextResponse.json({
      success: true,
      score: scoreResult.score,
      passed: scoreResult.passed,
      attempt,
      topic,
    });
  } catch (error) {
    console.error("[OverrideAttempt] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to override score" },
      { status: 500 },
    );
  }
}

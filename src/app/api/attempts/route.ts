import { NextResponse } from "next/server";
import { calculateScore } from "@/core/scoring";
import { calculateSpacedRepetition } from "@/core/spaced-repetition";
import { evaluateAnswer } from "@/lib/ai";
import { connectDB } from "@/lib/db";
import { Attempt, DayPlan, Question, Topic, UserSettings } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      questionId,
      topicId,
      answerText,
      inputMode = "text",
    } = await req.json();

    if (!questionId || !topicId || !answerText?.trim()) {
      return NextResponse.json(
        { error: "questionId, topicId, and answerText are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const [question, topic, settings] = await Promise.all([
      Question.findById(questionId),
      Topic.findOne({ _id: topicId, userId: user.id }),
      UserSettings.findOne({ userId: user.id }),
    ]);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const passScore = settings?.passScore ?? 70;

    // 1. Evaluate answer coverage using AI
    const gradingResult = await evaluateAnswer(
      question.text,
      question.modelAnswer,
      question.rubric,
      answerText,
    );

    // 2. Deterministically calculate score via core engine
    const scoreResult = calculateScore({
      rubric: question.rubric,
      evaluations: gradingResult.conceptResults,
      passScore,
    });

    // 3. Spaced repetition transition
    const srResult = calculateSpacedRepetition(
      {
        status: topic.status,
        reviewStep: topic.reviewStep,
        lapses: topic.lapses,
      },
      scoreResult.passed,
    );

    // 4. Update topic state
    topic.status = srResult.status;
    topic.reviewStep = srResult.reviewStep;
    topic.lapses = srResult.lapses;
    topic.nextReviewAt = srResult.nextReviewAt || undefined;
    topic.lastStudiedAt = new Date();
    topic.masteryScore = scoreResult.score;
    await topic.save();

    // 5. Record Attempt
    const attempt = await Attempt.create({
      userId: user.id,
      questionId: question._id,
      topicId: topic._id,
      answerText,
      inputMode,
      score: scoreResult.score,
      passed: scoreResult.passed,
      feedback: gradingResult,
    });

    // 6. Update today's plan item if topic is in today's plan
    const todayStr = new Date().toISOString().split("T")[0];
    await DayPlan.updateOne(
      { userId: user.id, date: todayStr, "items.topicId": topicId },
      { $set: { "items.$.status": scoreResult.passed ? "DONE" : "PLANNED" } },
    );

    return NextResponse.json({
      attempt,
      scoreResult,
      gradingResult,
      topicStatus: topic.status,
      nextReviewAt: topic.nextReviewAt,
    });
  } catch (error) {
    console.error("[SubmitAttempt] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Evaluation failed" },
      { status: 500 },
    );
  }
}

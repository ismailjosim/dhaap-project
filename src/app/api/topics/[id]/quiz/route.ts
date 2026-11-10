import { NextResponse } from "next/server";
import { generateTopicQuestions } from "@/lib/ai";
import { connectDB } from "@/lib/db";
import { Question, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const topic = await Topic.findOne({ _id: id, userId: user.id });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // 1. Check if questions are already cached
  let questions = await Question.find({ topicId: id }).lean();

  if (questions.length === 0) {
    // 2. Generate with Gemini AI
    try {
      const generated = await generateTopicQuestions(
        topic.title,
        topic.description,
      );

      const docs = generated.questions.map((q) => ({
        topicId: topic._id,
        text: q.text,
        difficulty: q.difficulty,
        rubric: q.rubric,
        modelAnswer: q.modelAnswer,
      }));

      await Question.insertMany(docs);
      questions = await Question.find({ topicId: id }).lean();
    } catch (aiErr) {
      console.error("[TopicQuiz] Failed to generate questions with AI:", aiErr);
      return NextResponse.json(
        { error: "Failed to generate interview questions. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ topic, questions });
}

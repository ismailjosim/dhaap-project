import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attempt, Note, Question, Topic } from "@/lib/models";
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

  const topic = await Topic.findOne({ _id: id, userId: user.id }).lean();
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const [questions, attempts, note] = await Promise.all([
    Question.find({ topicId: id }).lean(),
    Attempt.find({ topicId: id, userId: user.id })
      .sort({ createdAt: -1 })
      .lean(),
    Note.findOne({ topicId: id, userId: user.id }).lean(),
  ]);

  return NextResponse.json({ topic, questions, attempts, note });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const allowedUpdates = [
    "title",
    "description",
    "orderIndex",
    "estimatedMinutes",
    "status",
    "isUrgent",
  ];

  const updateData: Record<string, unknown> = {};
  for (const key of allowedUpdates) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  const topic = await Topic.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: updateData },
    { new: true },
  );

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ topic });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const topic = await Topic.findOneAndDelete({ _id: id, userId: user.id });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // Also clean up question, attempt, note associated with this topic
  await Promise.all([
    Question.deleteMany({ topicId: id }),
    Attempt.deleteMany({ topicId: id }),
    Note.deleteMany({ topicId: id }),
  ]);

  return NextResponse.json({ success: true });
}

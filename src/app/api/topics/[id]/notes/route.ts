import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Note } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;
  await connectDB();

  const note = await Note.findOne({ topicId, userId: user.id }).lean();
  return NextResponse.json({ note: note || { topicId, body: "" } });
}

export async function PUT(req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;
  const { body } = await req.json();

  await connectDB();

  const note = await Note.findOneAndUpdate(
    { topicId, userId: user.id },
    { $set: { body: body || "" } },
    { new: true, upsert: true },
  );

  return NextResponse.json({ note });
}

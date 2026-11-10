import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Note, Topic } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.id };
  if (query) {
    filter.body = { $regex: query, $options: "i" };
  }

  const notes = await Note.find(filter).sort({ updatedAt: -1 }).lean();

  // Populate topic details
  const topicIds = notes.map((n) => n.topicId);
  const topics = await Topic.find({ _id: { $in: topicIds } }).lean();
  const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));

  const enrichedNotes = notes.map((n) => ({
    ...n,
    topic: topicMap.get(n.topicId) || null,
  }));

  return NextResponse.json({ notes: enrichedNotes });
}

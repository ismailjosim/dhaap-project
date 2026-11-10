import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Roadmap, Topic } from "@/lib/models";
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

  const roadmap = await Roadmap.findOne({ _id: id, userId: user.id }).lean();
  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  const topics = await Topic.find({ roadmapId: id })
    .sort({ orderIndex: 1 })
    .lean();

  return NextResponse.json({ roadmap, topics });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  if (body.isActive) {
    await Roadmap.updateMany(
      { userId: user.id },
      { $set: { isActive: false } },
    );
  }

  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: body },
    { new: true },
  );

  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  return NextResponse.json({ roadmap });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const roadmap = await Roadmap.findOneAndDelete({ _id: id, userId: user.id });
  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  await Topic.deleteMany({ roadmapId: id });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DayPlan } from "@/lib/models";
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
  const { status, actualMinutes } = await req.json();

  await connectDB();

  const updateFields: Record<string, unknown> = {};
  if (status) updateFields["items.$.status"] = status;
  if (actualMinutes !== undefined)
    updateFields["items.$.actualMinutes"] = actualMinutes;

  const plan = await DayPlan.findOneAndUpdate(
    { userId: user.id, "items._id": id },
    { $set: updateFields },
    { new: true },
  );

  if (!plan) {
    return NextResponse.json({ error: "Plan item not found" }, { status: 404 });
  }

  return NextResponse.json({ plan });
}

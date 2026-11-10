import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserSettings } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";
import { getOrCreateUserSettings } from "@/lib/settings";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getOrCreateUserSettings(user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await connectDB();

    const allowedFields = [
      "timezone",
      "dailyCapMinutes",
      "recapCapMinutes",
      "passScore",
      "restWeekdays",
      "reviewWeekday",
      "planGenHour",
    ];

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: user.id },
      { $set: updateData },
      { new: true, upsert: true },
    );

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update settings" },
      { status: 500 },
    );
  }
}

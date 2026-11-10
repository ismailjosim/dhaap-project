import { NextResponse } from "next/server";
import { generateRoadmapTopics } from "@/lib/ai";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { goal, level } = await req.json();
    if (!goal || typeof goal !== "string") {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const draft = await generateRoadmapTopics(goal, level);
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[generateRoadmapTopics] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate roadmap" },
      { status: 500 },
    );
  }
}

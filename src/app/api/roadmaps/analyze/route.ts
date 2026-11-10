import { NextResponse } from "next/server";
import { analyzeTechnologyForRoadmap } from "@/lib/ai";
import { connectDB } from "@/lib/db";
import { AICache } from "@/lib/models";
import { getSessionUser } from "@/lib/server-auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, role } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Technology name or query is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Cache key normalized by technology query
    const normalizedKey = `tech_analysis:${query.trim().toLowerCase()}`;

    // 1. Check intelligent AI Cache
    const cached = await AICache.findOne({
      cacheKey: normalizedKey,
      cacheType: "TECH_ANALYSIS",
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      // Async hit count bump
      AICache.updateOne({ _id: cached._id }, { $inc: { hitCount: 1 } }).exec();
      return NextResponse.json({
        analysis: cached.data,
        cached: true,
      });
    }

    // 2. Compute via Gemini AI pipeline
    const analysis = await analyzeTechnologyForRoadmap(query, role);

    // 3. Store in TTL Cache for 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await AICache.findOneAndUpdate(
      { cacheKey: normalizedKey },
      {
        $set: {
          cacheKey: normalizedKey,
          cacheType: "TECH_ANALYSIS",
          data: analysis,
          expiresAt,
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    console.error("[analyzeTechnology] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze technology" },
      { status: 500 },
    );
  }
}

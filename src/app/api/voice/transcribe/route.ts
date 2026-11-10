import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const AUDIO_MODEL = process.env.GEMINI_AUDIO_MODEL || "gemini-3.5-flash";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const mimeType = file.type || "audio/webm";

    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction =
      "You are a technical audio transcriber. Transcribe verbatim. Keep English technical terms in English. Bangla speech in Bangla script. Do not summarize or correct grammar. Output only the transcribed text without extra greetings or quotes.";

    const response = await client.models.generateContent({
      model: AUDIO_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Transcribe this technical interview response verbatim:" },
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    const transcript = response.text?.trim() || "";

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("[VoiceTranscribe] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Transcription failed" },
      { status: 500 },
    );
  }
}

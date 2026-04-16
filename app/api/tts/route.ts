import { NextRequest, NextResponse } from "next/server";
import { generateTTS } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { text, gender } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const audioBuffer = await generateTTS(text as string, gender as string);
    const bytes = new Uint8Array(audioBuffer);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": bytes.length.toString(),
      },
    });
  } catch (err) {
    console.error("Error generating TTS:", err);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

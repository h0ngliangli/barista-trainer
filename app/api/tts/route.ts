import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { generateTTS } from "@/lib/gemini";

const PROFILE_PATH = path.join(process.cwd(), "data", "customer-profile.json");

function updateCustomerAudioFilename(customerId: string, audioFilename: string) {
  let data: { customers: Record<string, unknown>[] } = { customers: [] };
  try {
    data = JSON.parse(readFileSync(PROFILE_PATH, "utf-8"));
  } catch {
    return;
  }
  const entry = data.customers.find((c) => c.id === customerId);
  if (entry) {
    entry.audioFilename = audioFilename;
    writeFileSync(PROFILE_PATH, JSON.stringify(data, null, 2));
  }
}

function generateFilename(customerName: string): string {
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0") +
    "_" +
    String(now.getMilliseconds()).padStart(3, "0");
  const safeName = (customerName || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
  return `${ts}_${safeName}.wav`;
}

export async function POST(req: NextRequest) {
  try {
    const { text, gender, customerName, customerId } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const audioBuffer = await generateTTS(text as string, gender as string);
    const bytes = new Uint8Array(audioBuffer);

    const filename = generateFilename(customerName as string);
    const audioDir = path.join(process.cwd(), "data", "audio");
    mkdirSync(audioDir, { recursive: true });
    writeFileSync(path.join(audioDir, filename), audioBuffer);

    if (customerId) {
      updateCustomerAudioFilename(customerId as string, filename);
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": bytes.length.toString(),
        "X-Audio-Filename": filename,
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

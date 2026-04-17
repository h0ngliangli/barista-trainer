import { GoogleGenAI } from "@google/genai";
import { MODIFIERS, randomPickDrinkAndFood } from "./menu";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface CustomerProfile {
  id?: string;
  name: string;
  age: string;
  gender: string;
  region: string;
  personality: string[];
  orderText: string;
  canonicalOrder: string; // clean item list for scoring
  menuItems: string[];
  menuItemImages?: string[];
}

export async function generateCustomer(): Promise<CustomerProfile> {
  const model = genai.models;

  const prompt = `You are generating a realistic coffee shop customer for a barista training app.

Possible Food and Drink:
${JSON.stringify(randomPickDrinkAndFood())}

Possible modifiers:
${JSON.stringify(MODIFIERS)}

Return a JSON object with EXACTLY these fields:
{
  "name": "first name only",
  "age": "age range like 'teenager', '20s', '30s', '40s', '50s', 'elderly'",
  "gender": "male or female",
  "region": "US region or city, e.g. 'California', 'New York', 'Texas'",
  "personality": ["2-3 short trait tags, e.g. 'fast talker', 'very polite', 'mumbles'"],
  "orderText": "The customer's spoken order in natural conversational language. They may ramble, add filler words, change their mind mid-sentence, use slang, or be very precise — matching their personality. Must include at least one drink from the menu. May include food and modifiers.",
  "canonicalOrder": "A clean, minimal summary of what they actually ordered, e.g. 'Grande Caramel Macchiato, no whip, Butter Croissant'",
  "menuItems": [The exact menu item names the customer ordered]
}

Important:
- orderText should sound like real spoken speech (not a written order). Include filler words, hesitations, or personality quirks.
- canonicalOrder must only contain items that exist in the menu and modifiers list above.
- Return ONLY the JSON object, no markdown, no explanation.`;

  const response = await model.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as CustomerProfile;
}

// Gemini TTS returns raw 16-bit PCM at 24 kHz mono.
// Browsers need a WAV container around that PCM data to play it.
function pcmToWav(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4); // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // audio format: PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export async function generateTTS(
  text: string,
  gender: string = "female",
): Promise<Buffer> {
  const voiceName =
    gender === "male"
      ? ["Charon", "Fenrir", "Puck"][Math.floor(Math.random() * 3)]
      : ["Aoede", "Kore", "Zephyr"][Math.floor(Math.random() * 3)];
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ role: "user", parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error("No audio data returned from Gemini TTS");

  const pcm = Buffer.from(part.data, "base64");
  return pcmToWav(pcm);
}

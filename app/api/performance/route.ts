import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "performance.json");

interface SessionEntry {
  timestamp: string;
  customerName: string;
  audioFilename?: string;
  orderText: string;
  canonicalOrder: string;
  barristaInput: string;
  score: number;
  correct: boolean;
}

interface PerformanceData {
  sessions: SessionEntry[];
  totals: { correct: number; total: number };
}

function readData(): PerformanceData {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return { sessions: [], totals: { correct: 0, total: 0 } };
  }
}

export async function GET() {
  return NextResponse.json(readData());
}

export async function POST(req: NextRequest) {
  try {
    const entry: SessionEntry = await req.json();
    const data = readData();
    data.sessions.push({ ...entry, timestamp: new Date().toISOString() });
    data.totals.total += 1;
    if (entry.correct) data.totals.correct += 1;
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json(data.totals);
  } catch (err) {
    console.error("Error saving performance:", err);
    return NextResponse.json(
      { error: "Failed to save performance" },
      { status: 500 }
    );
  }
}

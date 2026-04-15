import { NextResponse } from "next/server";
import { generateCustomer } from "@/lib/gemini";

export async function GET() {
  try {
    const customer = await generateCustomer();
    return NextResponse.json(customer);
  } catch (err) {
    console.error("Error generating customer:", err);
    return NextResponse.json(
      { error: "Failed to generate customer" },
      { status: 500 }
    );
  }
}

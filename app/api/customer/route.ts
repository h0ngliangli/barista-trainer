import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { generateCustomer } from "@/lib/gemini";
import { getImageUrl } from "@/lib/menu"

const PROFILE_PATH = path.join(process.cwd(), "data", "customer-profile.json");

function appendCustomerProfile(customer: object) {
  let data: { customers: object[] } = { customers: [] };
  try {
    data = JSON.parse(readFileSync(PROFILE_PATH, "utf-8"));
  } catch {
    // file missing or corrupt, start fresh
  }
  data.customers.push({ ...customer, timestamp: new Date().toISOString() });
  writeFileSync(PROFILE_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const customer = await generateCustomer();
    const customerWithIdAndImages = { ...customer, id: randomUUID(), menuItemImages: customer.menuItems.map((item) => getImageUrl(item)).filter((img): img is string => !!img) };
    appendCustomerProfile(customerWithIdAndImages);
    return NextResponse.json(customerWithIdAndImages);
  } catch (err) {
    console.error("Error generating customer:", err);
    return NextResponse.json(
      { error: "Failed to generate customer" },
      { status: 500 }
    );
  }
}

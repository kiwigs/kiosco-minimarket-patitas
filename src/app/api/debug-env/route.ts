import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV ?? null,
    PANEL_PIN: process.env.PANEL_PIN ?? null,
  });
}

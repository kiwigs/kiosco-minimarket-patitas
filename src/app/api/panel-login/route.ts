import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const pin = body?.pin;
  const expectedPin = process.env.PANEL_PIN;

  // 🔍 En lugar de tirar error, devolvemos TODO lo que necesitamos ver
  return NextResponse.json({
    debug: true,
    receivedPin: pin ?? null,
    PANEL_PIN: expectedPin ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  });
}

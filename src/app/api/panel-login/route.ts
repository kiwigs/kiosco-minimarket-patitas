import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FALLBACK_PIN = "7012"; // mientras Vercel se pone las pilas

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const pin = body?.pin;

  // Intentamos leer desde env, si no hay, usamos el fallback
  const expectedPin = process.env.PANEL_PIN ?? FALLBACK_PIN;

  if (!pin || pin !== expectedPin) {
    return NextResponse.json(
      { error: "PIN incorrecto" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("panel_auth", "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return res;
}

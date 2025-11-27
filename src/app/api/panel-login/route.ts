import { NextResponse } from "next/server";

// 👇 Esto obliga a Vercel a usar Node.js runtime
export const config = {
  runtime: "nodejs",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const pin = body?.pin;
  const expectedPin = process.env.PANEL_PIN;

  if (!expectedPin) {
    return NextResponse.json(
      { error: "PANEL_PIN no está configurado en el servidor" },
      { status: 500 }
    );
  }

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

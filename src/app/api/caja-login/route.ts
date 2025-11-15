// app/api/caja-login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { pin?: string } | null;
  const pin = body?.pin ?? "";

  const expectedPin = process.env.CAJA_PIN;

  if (!expectedPin) {
    return NextResponse.json(
      { error: "PIN de caja no configurado en el servidor." },
      { status: 500 }
    );
  }

  if (pin !== expectedPin) {
    return NextResponse.json(
      { error: "PIN incorrecto." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // 👉 cookie de sesión (sin expiración fija = sesión de navegador)
  res.cookies.set("caja_auth", "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}

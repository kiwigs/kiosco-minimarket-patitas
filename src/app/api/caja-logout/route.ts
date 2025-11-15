// app/api/caja-logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // 👉 Sobrescribir la cookie con valor vacío y expiración inmediata
  res.cookies.set("caja_auth", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,      // expira YA
    path: "/",      // mismo path que en el login
  });

  return res;
}

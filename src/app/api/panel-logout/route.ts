import { NextResponse } from "next/server";

// 👇 Igual aquí
export const config = {
  runtime: "nodejs",
};

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("panel_auth");
  return res;
}

import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Borrar la cookie del panel
  res.cookies.delete("panel_auth");

  return res;
}

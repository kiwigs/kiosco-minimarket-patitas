import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("panel_auth")?.value;

  if (auth !== "1") {
    return NextResponse.json(
      { ok: false },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}

import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies(); // ✅ FIX

  cookieStore.delete("panel_auth");

  return Response.json({ ok: true });
}
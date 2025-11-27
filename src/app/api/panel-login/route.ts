import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// PIN por defecto si la env no existe (cámbialo si quieres)
const FALLBACK_PIN = "7012";

function getPanelPin(): string {
  const fromEnv = process.env.PANEL_PIN;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  return FALLBACK_PIN;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = body?.pin?.toString?.() ?? "";

    const expectedPin = getPanelPin();

    // 1) Validar PIN
    if (pin !== expectedPin) {
      return NextResponse.json(
        { ok: false, message: "PIN incorrecto" },
        { status: 401 }
      );
    }

    // 2) Setear cookie de sesión del panel
    const cookieStore = await cookies(); // <- aquí era el problema

    cookieStore.set("panel_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });

    // 3) Listo, login correcto
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/panel-login:", error);
    return NextResponse.json(
      { ok: false, message: "Error interno en el login del panel" },
      { status: 500 }
    );
  }
}

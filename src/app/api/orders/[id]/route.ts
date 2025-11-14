import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type PatchBody = {
  status?: string;
};

// PATCH /api/orders/:id  → actualizar estado de la orden (ej. "pagado")
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // En Next 15, params es un Promise
    const { id } = await context.params;
    const orderId = Number(id);

    if (Number.isNaN(orderId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Leer body SIN usar "any"
    let body: PatchBody = {};
    try {
      const raw = await req.json();
      body = raw as PatchBody;
    } catch {
      body = {};
    }

    const status =
      body.status && body.status.trim() !== ""
        ? body.status
        : "pagado"; // valor por defecto

    // Si no quieres que haga nada en DB aún, comenta este bloque:
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      orderId,
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/orders/[id]:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

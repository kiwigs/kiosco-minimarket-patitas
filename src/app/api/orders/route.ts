import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // si no usas alias "@", cambia a "../../lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total } = body as {
      items: Record<string, number>;
      total: number;
    };

    const client = await pool.connect();
    try {
      // calcular siguiente ID correlativo
      const { rows } = await client.query(
        "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM orders"
      );
      const nextId = Number(rows[0].next_id);
      const code = nextId.toString().padStart(3, "0"); // "001", "002", ...

      const insertRes = await client.query(
        `INSERT INTO orders (code, items, total, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code, items, total, status, created_at`,
        [code, JSON.stringify(items), total, "PENDIENTE_DE_PAGO"]
      );

      const order = insertRes.rows[0];
      return NextResponse.json(order, { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en POST /api/orders:", err);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const client = await pool.connect();
    try {
      let result;
      if (status) {
        result = await client.query(
          `SELECT id, code, items, total, status, created_at
           FROM orders
           WHERE status = $1
           ORDER BY created_at DESC`,
          [status]
        );
      } else {
        result = await client.query(
          `SELECT id, code, items, total, status, created_at
           FROM orders
           ORDER BY created_at DESC`
        );
      }

      return NextResponse.json(result.rows, { status: 200 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en GET /api/orders:", err);
    return NextResponse.json(
      { error: "Error al listar órdenes" },
      { status: 500 }
    );
  }
}

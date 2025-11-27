// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { CategoriaBase, Producto } from "../route";

export const runtime = "nodejs";

function rowToProducto(row: any): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    sub: row.sub,
    categoria: row.categoria,
    precio: Number(row.precio),
    activo: row.activo,
    imageUrl: row.image_url ?? undefined,
  };
}

type RouteContext = {
  params: { id: string };
};

// PATCH /api/products/[id]  → actualizar producto
export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = ctx.params;

  try {
    const body = await req.json();
    const {
      nombre,
      sub,
      categoria,
      precio,
      activo,
      imageUrl,
    } = body as Partial<{
      nombre: string;
      sub: string;
      categoria: CategoriaBase;
      precio: number;
      activo: boolean;
      imageUrl: string;
    }>;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      values.push(nombre);
    }
    if (sub !== undefined) {
      fields.push(`sub = $${idx++}`);
      values.push(sub);
    }
    if (categoria !== undefined) {
      fields.push(`categoria = $${idx++}`);
      values.push(categoria);
    }
    if (precio !== undefined) {
      fields.push(`precio = $${idx++}`);
      values.push(precio);
    }
    if (activo !== undefined) {
      fields.push(`activo = $${idx++}`);
      values.push(activo);
    }
    if (imageUrl !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(imageUrl);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // updated_at siempre
    fields.push(`updated_at = NOW()`);

    const client = await pool.connect();
    try {
      values.push(id);
      const query = `
        UPDATE products
        SET ${fields.join(", ")}
        WHERE id = $${idx}
        RETURNING id, nombre, sub, categoria, precio, activo, image_url
      `;

      const result = await client.query(query, values);

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      const producto = rowToProducto(result.rows[0]);
      return NextResponse.json(producto, { status: 200 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en PATCH /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]  → eliminar producto
export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = ctx.params;

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM products WHERE id = $1",
        [id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en DELETE /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Error eliminando producto" },
      { status: 500 }
    );
  }
}

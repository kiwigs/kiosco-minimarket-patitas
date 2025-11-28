// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export type CategoriaBase = "Alimentos" | "Premios" | "Grooming" | "Recetados";

export type Producto = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

type ProductRow = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: string | number;
  activo: boolean;
  image_url: string | null;
};

function rowToProducto(row: ProductRow): Producto {
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

function generarId(nombre: string, sub: string) {
  const base = `${nombre}-${sub}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const sufijo = randomUUID().slice(0, 6);
  return `${base}-${sufijo}`;
}

// GET /api/products  → lista todo el catálogo
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query<ProductRow>(
      `SELECT id, nombre, sub, categoria, precio, activo, image_url
       FROM products
       ORDER BY nombre ASC`
    );
    const productos = result.rows.map(rowToProducto);
    return NextResponse.json(productos, { status: 200 });
  } catch (err) {
    console.error("Error en GET /api/products:", err);
    return NextResponse.json(
      { error: "Error al listar productos" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST /api/products  → crear producto nuevo
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      sub,
      categoria,
      precio,
      activo = true,
      imageUrl,
      img,
      image,
    } = body as {
      nombre: string;
      sub: string;
      categoria: CategoriaBase;
      precio: number;
      activo?: boolean;
      imageUrl?: string;
      img?: string;
      image?: string;
    };

    const finalImageUrl = imageUrl ?? img ?? image ?? null;

    if (
      !nombre ||
      !sub ||
      !categoria ||
      typeof precio !== "number" ||
      Number.isNaN(precio)
    ) {
      return NextResponse.json(
        { error: "Datos inválidos para crear producto" },
        { status: 400 }
      );
    }

    const id = generarId(nombre, sub);

    const client = await pool.connect();
    try {
      const result = await client.query<ProductRow>(
        `INSERT INTO products (id, nombre, sub, categoria, precio, activo, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nombre, sub, categoria, precio, activo, image_url`,
        [id, nombre, sub, categoria, precio, activo, finalImageUrl]
      );

      const producto = rowToProducto(result.rows[0]);
      return NextResponse.json(producto, { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error en POST /api/products:", err);
    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 }
    );
  }
}

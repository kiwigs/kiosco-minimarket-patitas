// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type CategoriaBase = "Alimentos" | "Premios" | "Grooming" | "Recetados";

type Producto = {
  id: string;
  nombre: string;
  sub: string;
  categoria: CategoriaBase;
  precio: number;
  activo: boolean;
  imageUrl?: string;
};

const DB_PATH = path.join(process.cwd(), "src", "data", "products.json");

async function readDb(): Promise<Producto[]> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Producto[];
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;

    if (error.code === "ENOENT") {
      // si no existe, la creamos vacía
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, "[]", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeDb(data: Producto[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// GET /api/products
export async function GET() {
  try {
    const productos = await readDb();
    return NextResponse.json(productos);
  } catch (err) {
    console.error("Error leyendo productos:", err);
    return NextResponse.json(
      { error: "Error leyendo productos" },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nuevo: Producto = {
      id: Date.now().toString(),
      nombre: (body.nombre ?? "").toString(),
      sub: (body.sub ?? "").toString(),
      categoria: body.categoria as CategoriaBase,
      precio: Number(body.precio ?? 0),
      activo: Boolean(body.activo),
      imageUrl: body.imageUrl ? body.imageUrl.toString() : undefined,
    };

    if (!nuevo.nombre || !nuevo.sub || Number.isNaN(nuevo.precio)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const productos = await readDb();
    productos.push(nuevo);
    await writeDb(productos);

    return NextResponse.json(nuevo, { status: 201 });
  } catch (err) {
    console.error("Error creando producto:", err);
    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 }
    );
  }
}

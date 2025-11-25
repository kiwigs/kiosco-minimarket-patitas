// src/app/api/products/[id]/route.ts
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

// PATCH /api/products/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const productos = await readDb();
    const idx = productos.findIndex((p) => p.id === id);

    if (idx === -1) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const current = productos[idx];

    const actualizado: Producto = {
      ...current,
      nombre:
        body.nombre !== undefined ? body.nombre.toString() : current.nombre,
      sub: body.sub !== undefined ? body.sub.toString() : current.sub,
      categoria:
        body.categoria !== undefined
          ? (body.categoria as CategoriaBase)
          : current.categoria,
      precio:
        body.precio !== undefined
          ? Number(body.precio)
          : current.precio,
      activo:
        body.activo !== undefined
          ? Boolean(body.activo)
          : current.activo,
      imageUrl:
        body.imageUrl !== undefined
          ? body.imageUrl
            ? body.imageUrl.toString()
            : undefined
          : current.imageUrl,
    };

    productos[idx] = actualizado;
    await writeDb(productos);

    return NextResponse.json(actualizado);
  } catch (err) {
    console.error("Error actualizando producto:", err);
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(req: Request) {
  try {
    // Tomamos el id desde la URL para evitar el segundo argumento tipado raro
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1] ?? "";

    if (!id) {
      return NextResponse.json(
        { error: "ID no proporcionado" },
        { status: 400 }
      );
    }

    const productos = await readDb();
    const filtered = productos.filter((p) => p.id !== id);

    if (filtered.length === productos.length) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    await writeDb(filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    return NextResponse.json(
      { error: "Error eliminando producto" },
      { status: 500 }
    );
  }
}

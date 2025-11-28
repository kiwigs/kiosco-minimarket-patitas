// src/app/api/upload/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
        { status: 400 }
      );
    }

    // Leemos el archivo en memoria
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tipo MIME de la imagen (image/png, image/jpeg, etc.)
    const mime = file.type || "application/octet-stream";

    // Lo convertimos a base64
    const base64 = buffer.toString("base64");

    // Data URL usable directamente en <img src="...">
    const dataUrl = `data:${mime};base64,${base64}`;

    // El panel espera { url: string }
    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    console.error("Error en /api/upload:", err);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

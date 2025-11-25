// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const ext = file.name.split(".").pop() || "bin";
    const filename =
      Date.now().toString() +
      "-" +
      Math.random().toString(16).slice(2) +
      "." +
      ext;

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Esta URL es la que se guarda en imageUrl y se usa en <img src="...">
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Error subiendo archivo:", err);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

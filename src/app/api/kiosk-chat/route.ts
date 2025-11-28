import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const messages = body?.messages as
      | { role: string; content: string }[]
      | undefined;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          error:
            "El formato de mensajes es inválido. Vuelve a cargar el kiosco o contacta al administrador.",
        },
        { status: 200 }
      );
    }

    // 🧪 Leer la API key en TIEMPO DE EJECUCIÓN
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(
        "[/api/kiosk-chat] Falta OPENROUTER_API_KEY en el entorno del servidor"
      );

      return NextResponse.json(
        {
          error:
            "El chat de IA no está configurado: falta la variable OPENROUTER_API_KEY en el servidor.",
        },
        { status: 200 }
      );
    }

    // Crear el cliente usando la API key ya verificada
    const openrouter = createOpenRouter({ apiKey });

    const conversationText = messages
      .map((m) => `${m.role === "user" ? "Cliente" : "Asistente"}: ${m.content}`)
      .join("\n");

    const { text } = await generateText({
      model: openrouter("meta-llama/llama-3-8b-instruct"),
      prompt: `
Eres un asistente veterinario digital de Minimarket Patitas.

Reglas:
- Responde SIEMPRE en español.
- Solo das orientación general (alimentación, higiene, signos de alarma).
- NO indiques dosis ni tratamientos exactos.
- Si hay síntomas graves (sangrado, dificultad respiratoria, convulsiones, dolor intenso, apatía extrema, vómitos o diarrea con sangre, etc.),
  indica que requiere atención veterinaria PRESENCIAL inmediata.
- Si el caso es complejo pero no urgente, sugiere agendar cita online y añade:
  "Puedes agendar una cita con nuestra especialista aquí: https://calendly.com/tu-vet".

Historial:
${conversationText}

Responde al último mensaje del cliente de forma breve y clara.
      `.trim(),
    });

    return NextResponse.json({ reply: text }, { status: 200 });
  } catch (err) {
    console.error("Error en /api/kiosk-chat:", err);
    return NextResponse.json(
      {
        error:
          "Hubo un error interno al llamar al modelo de IA. Revisa la configuración de OPENROUTER_API_KEY o los logs del servidor.",
      },
      { status: 200 }
    );
  }
}

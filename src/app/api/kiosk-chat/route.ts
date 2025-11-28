import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Provider de OpenRouter para el AI SDK
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Formato inválido de mensajes desde el cliente." },
        { status: 400 }
      );
    }

    // Si no hay API key -> devolvemos error CLARO al frontend
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Falta configurar OPENROUTER_API_KEY (.env.local en dev y Environment Variables en Vercel).",
        },
        { status: 500 }
      );
    }

    // Convertimos todo el historial en texto para un prompt sencillo
    const conversationText = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Cliente" : "Asistente"}: ${m.content}`
      )
      .join("\n");

    const { text } = await generateText({
      // cualquier modelo soportado por OpenRouter, este es barato y decente
      model: openrouter("meta-llama/llama-3-8b-instruct"),
      prompt: `
Eres un asistente veterinario digital de Minimarket Patitas.

Reglas:
- Responde SIEMPRE en español.
- Solo das orientación general (alimentación, higiene, signos de alarma).
- NO indiques dosis ni tratamientos exactos.
- Si hay síntomas graves (sangrado, dificultad respiratoria, convulsiones, dolor intenso, apatía extrema, vómitos o diarrea con sangre, etc.):
  di claramente que requiere atención veterinaria PRESENCIAL inmediata.
- Si el caso es complejo pero no urgente, sugiere agendar cita online y añade:
  "Puedes agendar una cita con nuestra especialista aquí: https://calendly.com/tu-vet".

Historial de conversación:
${conversationText}

Responde al último mensaje del cliente de forma clara y breve.
      `.trim(),
    });

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Error en /api/kiosk-chat:", err);
    return NextResponse.json(
      { error: "Error interno en el servidor de chat." },
      { status: 500 }
    );
  }
}

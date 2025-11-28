import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Formato inválido" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("NO HAY API KEY");
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Kiosco-Minimarket-Patitas",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
Eres un asistente veterinario digital para Minimarket Patitas.

Responde:
- Claro, amable y en español.
- Solo orientación básica (alimentación, higiene, primeros signos).
- NO das dosis ni tratamientos.
- Si hay síntomas graves: "Esto requiere atención veterinaria inmediata."
- Si es un caso complejo pero no urgente: "Puedes agendar una cita en: https://calendly.com/tu-vet".
            `,
          },
          ...messages
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error OpenRouter:", err);
      return NextResponse.json(
        { error: "Falla en OpenRouter" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No pude responder.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("ERROR GENERAL:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

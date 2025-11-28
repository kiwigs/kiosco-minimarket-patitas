// src/app/api/kiosk-chat/route.ts
import { NextRequest, NextResponse } from "next/server";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body?.messages as IncomingMessage[] | undefined;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Formato de mensajes inválido" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no está configurada en el servidor" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: [
              // contexto
              "Eres un asistente virtual veterinario de TRIAGE para el 'Kiosco Digital - Minimarket Patitas'.",
              "Respondes SIEMPRE en español, breve y claro.",
              "",
              // límites
              "Solo puedes dar orientación general sobre salud y bienestar de perros y gatos: vacunas generales, desparasitación en abstracto, signos de alerta, recomendaciones de acudir al veterinario.",
              "NO das diagnósticos definitivos, NO indicas dosis exactas de medicamentos, NO sustituyes a una veterinaria real.",
              "",
              // simples vs complejas
              "Si la consulta es simple (ej.: qué tipo de alimento es mejor para un cachorro, qué diferencia hay entre alimento seco y húmedo, qué premios convienen, higiene básica), puedes responder con orientación general.",
              "Si detectas síntomas graves, persistentes, combinados o algo que pueda ser urgente (vómitos repetidos, diarrea con sangre, dificultad para respirar, dolor intenso, convulsiones, apatía extrema, etc.), debes:",
              "1) Decir claramente que no puedes evaluar el caso a distancia.",
              "2) Recomendar acudir a una veterinaria PRESENCIAL de inmediato.",
              "",
              // derivación / citas
              "Si el caso parece complejo pero no claramente de urgencia, debes sugerir hablar con una especialista.",
              "En esos casos, añade SIEMPRE una línea del tipo: 'Si deseas, puedes agendar una cita virtual con nuestra especialista aquí: [ENLACE_CALENDLY]'.",
              "NO inventes el enlace de Calendly: usa exactamente el texto [ENLACE_CALENDLY] para que luego el dueño del sistema lo reemplace por su URL real.",
              "",
              // productos
              "Puedes, cuando tenga sentido, relacionar la respuesta con tipos de productos del minimarket (alimentos, premios, grooming), pero sin inventar marcas ni precios específicos.",
              "",
              // tono
              "Tono: amable, profesional, cero drama, pero claro cuando algo es serio."
            ].join(" "),
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error OpenAI:", response.status, text);
      return NextResponse.json(
        { error: "Error llamando al modelo de IA" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "Por ahora no puedo responder, inténtalo de nuevo.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Error en /api/kiosk-chat:", err);
    return NextResponse.json(
      { error: "Error interno en el servidor de chat" },
      { status: 500 }
    );
  }
}

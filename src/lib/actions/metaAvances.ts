"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, claudeErrorMessage } from "@/lib/claude";
import { todayISOForUser } from "@/lib/server-date";
import { recalcularProgresoMeta } from "@/lib/actions/metaObjetivos";

const AtribucionSchema = z.object({
  objetivo_id: z.string(),
  cantidad: z.number().nonnegative(),
  nota: z.string(),
});

const EvaluacionSchema = z.object({
  resumen: z.string(),
  atribuciones: z.array(AtribucionSchema),
});

export interface AtribucionPropuesta {
  objetivo_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  nota: string;
}

const SYSTEM_PROMPT = `Eres un asistente que evalúa, de forma conservadora, cuánto avanzó una persona hacia los objetivos de una meta a partir de un texto libre donde describe lo que hizo.

Te darán una lista de objetivos existentes (con su id, nombre, tipo y unidad) y el texto del usuario. Para cada objetivo que el texto respalde claramente, calcula cuánto se avanzó, en la unidad de ese objetivo:

- "frecuencia" y "acumulado": "cantidad" es cuánto se suma a ese objetivo (ej. si el objetivo es "publicaciones" y el texto dice "publiqué 2 posts", cantidad = 2).
- "hito": "cantidad" es 1 si el texto indica que el hito se completó, 0 si no.

Reglas estrictas:
- Nunca inventes un "objetivo_id" que no esté en la lista que te dieron. Usa exactamente los ids que te proporcionan.
- Solo incluye un objetivo en "atribuciones" si el texto da evidencia razonable de avance en él. Si el texto no dice nada relacionado con un objetivo, no lo incluyas.
- Sé conservador: ante la duda, usa una cantidad menor o no incluyas el objetivo.
- "nota" es una frase muy breve (máx. 15 palabras) citando o resumiendo qué parte del texto justifica esa cantidad.
- "resumen" es una frase breve en español resumiendo tu evaluación general para mostrarle al usuario.
- Si el texto no respalda ningún objetivo, responde con "atribuciones": [] y explica por qué en "resumen".`;

/** Evalúa el texto contra los objetivos de la meta. No persiste nada: el usuario revisa antes de aplicar. */
export async function evaluarAvanceConIA(
  metaId: string,
  texto: string
): Promise<{ error?: string; resumen?: string; atribuciones?: AtribucionPropuesta[] }> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) return { error: "Describe qué hiciste para esta meta." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: meta } = await supabase.from("metas").select("titulo").eq("id", metaId).eq("user_id", user.id).single();
  if (!meta) return { error: "No se encontró la meta." };

  const { data: objetivos, error: objetivosError } = await supabase
    .from("meta_objetivos")
    .select("id, nombre, tipo, unidad, cantidad_objetivo, periodo")
    .eq("meta_id", metaId)
    .eq("user_id", user.id)
    .order("orden");

  if (objetivosError) return { error: objetivosError.message };
  if (!objetivos || objetivos.length === 0) {
    return { error: "Esta meta todavía no tiene objetivos. Genera o agrega objetivos primero." };
  }

  const objetivosPorId = new Map(objetivos.map((o) => [o.id, o]));
  const listaObjetivos = objetivos
    .map((o) => `- id: ${o.id} | nombre: "${o.nombre}" | tipo: ${o.tipo} | unidad: "${o.unidad}"`)
    .join("\n");

  try {
    const client = getClaudeClient();
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Meta: "${meta.titulo}"\n\nObjetivos de esta meta:\n${listaObjetivos}\n\nTexto del usuario sobre lo que hizo:\n"${textoLimpio}"`,
        },
      ],
      output_config: { format: zodOutputFormat(EvaluacionSchema) },
    });

    if (!response.parsed_output) return { error: "Claude no devolvió una respuesta válida. Intenta de nuevo." };

    // Nunca confiar ciegamente en los ids que devuelve el modelo: se filtran
    // contra los objetivos reales de esta meta antes de mostrarlos.
    const atribuciones: AtribucionPropuesta[] = response.parsed_output.atribuciones
      .filter((a) => objetivosPorId.has(a.objetivo_id) && a.cantidad > 0)
      .map((a) => {
        const objetivo = objetivosPorId.get(a.objetivo_id)!;
        return { objetivo_id: a.objetivo_id, nombre: objetivo.nombre, unidad: objetivo.unidad, cantidad: a.cantidad, nota: a.nota };
      });

    return { resumen: response.parsed_output.resumen, atribuciones };
  } catch (error) {
    return { error: claudeErrorMessage(error) };
  }
}

export interface AtribucionAplicar {
  objetivo_id: string;
  cantidad: number;
  nota: string;
}

/** Guarda el registro de texto libre y los avances que el usuario confirmó (ya editados/revisados). */
export async function aplicarAvance(
  metaId: string,
  texto: string,
  atribuciones: AtribucionAplicar[]
): Promise<{ error?: string }> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) return { error: "Describe qué hiciste para esta meta." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: meta } = await supabase.from("metas").select("id").eq("id", metaId).eq("user_id", user.id).single();
  if (!meta) return { error: "No se encontró la meta." };

  const confirmadas = atribuciones.filter((a) => a.cantidad > 0);
  if (confirmadas.length > 0) {
    const { data: objetivosValidos } = await supabase
      .from("meta_objetivos")
      .select("id")
      .eq("meta_id", metaId)
      .eq("user_id", user.id)
      .in(
        "id",
        confirmadas.map((a) => a.objetivo_id)
      );
    const idsValidos = new Set((objetivosValidos ?? []).map((o) => o.id));
    const invalido = confirmadas.find((a) => !idsValidos.has(a.objetivo_id));
    if (invalido) return { error: "Uno de los objetivos ya no existe. Actualiza la página e intenta de nuevo." };
  }

  const fecha = await todayISOForUser();

  const { data: registro, error: registroError } = await supabase
    .from("meta_registros")
    .insert({ meta_id: metaId, user_id: user.id, fecha, texto: textoLimpio })
    .select("id")
    .single();

  if (registroError || !registro) return { error: registroError?.message ?? "No se pudo guardar el registro." };

  if (confirmadas.length > 0) {
    const { error: avancesError } = await supabase.from("meta_objetivo_avances").insert(
      confirmadas.map((a) => ({
        objetivo_id: a.objetivo_id,
        meta_id: metaId,
        user_id: user.id,
        registro_id: registro.id,
        fecha,
        cantidad: a.cantidad,
        nota: a.nota,
      }))
    );
    if (avancesError) return { error: avancesError.message };
  }

  const porcentaje = await recalcularProgresoMeta(supabase, user.id, metaId);
  await supabase.from("meta_progreso_historial").insert({
    meta_id: metaId,
    user_id: user.id,
    progreso: porcentaje,
    nota: textoLimpio.length > 140 ? `${textoLimpio.slice(0, 140)}…` : textoLimpio,
  });

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return {};
}

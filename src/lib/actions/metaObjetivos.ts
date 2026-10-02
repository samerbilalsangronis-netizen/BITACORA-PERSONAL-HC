"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, claudeErrorMessage } from "@/lib/claude";
import { calcularProgresoMeta, indexarAvancesPorObjetivo } from "@/lib/metasProgreso";
import { todayISOForUser } from "@/lib/server-date";
import type {
  EstadoMeta,
  MetaObjetivo,
  MetaObjetivoAvance,
  OrigenObjetivo,
  PeriodoObjetivo,
  TipoObjetivo,
} from "@/lib/supabase/types";

/**
 * Recalcula el % de una meta a partir de sus objetivos/avances y lo persiste
 * en `metas.progreso` (reemplaza el slider manual). Se llama tras cualquier
 * cambio que afecte el cálculo: crear/editar/eliminar objetivos o aplicar un avance.
 */
export async function recalcularProgresoMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  metaId: string
): Promise<number> {
  const { data: meta } = await supabase
    .from("metas")
    .select("fecha_inicio, estado")
    .eq("id", metaId)
    .eq("user_id", userId)
    .single();
  if (!meta) return 0;

  const [{ data: objetivos }, { data: avances }] = await Promise.all([
    supabase.from("meta_objetivos").select("*").eq("meta_id", metaId).eq("user_id", userId),
    supabase.from("meta_objetivo_avances").select("*").eq("meta_id", metaId).eq("user_id", userId),
  ]);

  const today = await todayISOForUser();
  const porcentaje = calcularProgresoMeta(
    (objetivos ?? []) as MetaObjetivo[],
    indexarAvancesPorObjetivo((avances ?? []) as MetaObjetivoAvance[]),
    meta.fecha_inicio,
    today
  );

  const patch: { progreso: number; estado?: EstadoMeta } = { progreso: porcentaje };
  if (porcentaje >= 100 && meta.estado !== "completada") patch.estado = "completada";

  await supabase.from("metas").update(patch).eq("id", metaId).eq("user_id", userId);
  return porcentaje;
}

const ObjetivoPropuestoSchema = z.object({
  nombre: z.string(),
  tipo: z.enum(["frecuencia", "hito", "acumulado"]),
  cantidad_objetivo: z.number().positive(),
  periodo: z.enum(["dia", "semana", "mes"]).nullable(),
  unidad: z.string(),
  peso: z.number().positive(),
  justificacion: z.string(),
});

const ObjetivosGeneradosSchema = z.object({
  objetivos: z.array(ObjetivoPropuestoSchema).min(1).max(6),
});

export type ObjetivoPropuesto = z.infer<typeof ObjetivoPropuestoSchema>;

const SYSTEM_PROMPT = `Eres un asistente que ayuda a convertir una meta personal en objetivos medibles y realistas, dentro de una app de productividad y psicología de trading.

No todas las metas se miden igual, así que cada objetivo que propongas debe tener uno de estos 3 tipos:

- "frecuencia": una acción recurrente que se repite por período (ej. "publicar 1 post al día", "ir al gym 5 veces por semana"). Requiere "periodo": "dia" | "semana" | "mes", y "cantidad_objetivo" es cuántas veces por ese período.
- "hito": un paso discreto de una lista de tareas, que se marca como hecho o no (ej. "definir el plan de contenido", "abrir la cuenta de ahorro"). "cantidad_objetivo" siempre es 1 y "periodo" debe ser null.
- "acumulado": una cantidad que se va sumando hacia un total (ej. "ahorrar $1000", "leer 12 libros este año"). "cantidad_objetivo" es el total a alcanzar y "periodo" debe ser null.

Reglas:
- Propón entre 1 y 5 objetivos que en conjunto representen bien el progreso de la meta. No inventes objetivos redundantes.
- "unidad" debe ser una palabra o frase corta y natural en español (ej. "publicaciones", "vasos", "dólares", "minutos", "veces", "libros"). Si el objetivo es un hito simple, puede ser "".
- "peso" es la importancia relativa de ese objetivo dentro del progreso total de la meta (un número positivo; no hace falta que sumen 100, se normalizan automáticamente). Objetivos más centrales a la meta deben pesar más.
- "justificacion" es una frase breve (máx. 20 palabras) explicando por qué ese objetivo mide bien parte de la meta.
- Responde solo con los objetivos, basándote en el título y la descripción de la meta que te den.`;

export async function generarObjetivosConIA(
  metaId: string
): Promise<{ error?: string; objetivos?: ObjetivoPropuesto[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: meta, error: metaError } = await supabase
    .from("metas")
    .select("titulo, descripcion, tipo, fecha_inicio, fecha_objetivo")
    .eq("id", metaId)
    .eq("user_id", user.id)
    .single();

  if (metaError || !meta) return { error: "No se encontró la meta." };

  const plazoLabel = { corto_plazo: "corto plazo", mediano_plazo: "mediano plazo", largo_plazo: "largo plazo" }[
    meta.tipo as "corto_plazo" | "mediano_plazo" | "largo_plazo"
  ];

  const detalle = [
    `Título: ${meta.titulo}`,
    meta.descripcion ? `Descripción: ${meta.descripcion}` : null,
    `Plazo: ${plazoLabel}`,
    meta.fecha_objetivo ? `Fecha objetivo: ${meta.fecha_objetivo}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = getClaudeClient();
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Propón objetivos medibles para esta meta:\n\n${detalle}` }],
      output_config: { format: zodOutputFormat(ObjetivosGeneradosSchema) },
    });

    if (!response.parsed_output) return { error: "Claude no devolvió una respuesta válida. Intenta de nuevo." };

    return { objetivos: response.parsed_output.objetivos };
  } catch (error) {
    return { error: claudeErrorMessage(error) };
  }
}

export interface ObjetivoGuardarInput {
  nombre: string;
  tipo: TipoObjetivo;
  cantidad_objetivo: number;
  periodo: PeriodoObjetivo | null;
  unidad: string;
  peso: number;
  origen: OrigenObjetivo;
}

function revalidar() {
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

function validarObjetivo(o: ObjetivoGuardarInput): string | null {
  if (!o.nombre.trim()) return "Cada objetivo necesita un nombre.";
  if (!(o.cantidad_objetivo > 0)) return "La cantidad objetivo debe ser mayor a 0.";
  if (!(o.peso > 0)) return "El peso debe ser mayor a 0.";
  if (o.tipo === "frecuencia" && !o.periodo) return "Los objetivos de frecuencia necesitan un período.";
  if (o.tipo !== "frecuencia" && o.periodo) return "Solo los objetivos de frecuencia usan período.";
  return null;
}

/** Reemplaza todos los objetivos de una meta por la lista final (ya editada por el usuario). */
export async function guardarObjetivosGenerados(
  metaId: string,
  objetivos: ObjetivoGuardarInput[]
): Promise<{ error?: string; data?: MetaObjetivo[] }> {
  if (objetivos.length === 0) return { error: "Agrega al menos un objetivo." };
  for (const o of objetivos) {
    const err = validarObjetivo(o);
    if (err) return { error: err };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: meta } = await supabase.from("metas").select("id").eq("id", metaId).eq("user_id", user.id).single();
  if (!meta) return { error: "No se encontró la meta." };

  const { error: deleteError } = await supabase.from("meta_objetivos").delete().eq("meta_id", metaId).eq("user_id", user.id);
  if (deleteError) return { error: deleteError.message };

  const { data, error: insertError } = await supabase
    .from("meta_objetivos")
    .insert(
      objetivos.map((o, i) => ({
        meta_id: metaId,
        user_id: user.id,
        nombre: o.nombre.trim(),
        tipo: o.tipo,
        cantidad_objetivo: o.cantidad_objetivo,
        periodo: o.periodo,
        unidad: o.unidad.trim(),
        peso: o.peso,
        origen: o.origen,
        orden: i,
      }))
    )
    .select();

  if (insertError) return { error: insertError.message };

  await recalcularProgresoMeta(supabase, user.id, metaId);
  revalidar();
  return { data: (data ?? []) as MetaObjetivo[] };
}

export async function crearObjetivoManual(
  metaId: string,
  input: Omit<ObjetivoGuardarInput, "origen">
): Promise<{ error?: string; data?: MetaObjetivo }> {
  const err = validarObjetivo({ ...input, origen: "usuario" });
  if (err) return { error: err };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: meta } = await supabase.from("metas").select("id").eq("id", metaId).eq("user_id", user.id).single();
  if (!meta) return { error: "No se encontró la meta." };

  const { data: ultimo } = await supabase
    .from("meta_objetivos")
    .select("orden")
    .eq("meta_id", metaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("meta_objetivos")
    .insert({
      meta_id: metaId,
      user_id: user.id,
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      cantidad_objetivo: input.cantidad_objetivo,
      periodo: input.periodo,
      unidad: input.unidad.trim(),
      peso: input.peso,
      origen: "usuario",
      orden: (ultimo?.orden ?? -1) + 1,
    })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el objetivo." };

  await recalcularProgresoMeta(supabase, user.id, metaId);
  revalidar();
  return { data: data as MetaObjetivo };
}

export async function actualizarObjetivo(
  objetivoId: string,
  input: Partial<Omit<ObjetivoGuardarInput, "origen">>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: actual } = await supabase
    .from("meta_objetivos")
    .select("meta_id, nombre, tipo, cantidad_objetivo, periodo, unidad, peso")
    .eq("id", objetivoId)
    .eq("user_id", user.id)
    .single();
  if (!actual) return { error: "No se encontró el objetivo." };

  const merged: ObjetivoGuardarInput = {
    nombre: input.nombre ?? actual.nombre,
    tipo: input.tipo ?? (actual.tipo as TipoObjetivo),
    cantidad_objetivo: input.cantidad_objetivo ?? actual.cantidad_objetivo,
    periodo: input.periodo !== undefined ? input.periodo : (actual.periodo as PeriodoObjetivo | null),
    unidad: input.unidad ?? actual.unidad,
    peso: input.peso ?? actual.peso,
    origen: "usuario",
  };
  const err = validarObjetivo(merged);
  if (err) return { error: err };

  const patch: Partial<MetaObjetivo> = {};
  if (input.nombre !== undefined) patch.nombre = input.nombre.trim();
  if (input.tipo !== undefined) patch.tipo = input.tipo;
  if (input.cantidad_objetivo !== undefined) patch.cantidad_objetivo = input.cantidad_objetivo;
  if (input.periodo !== undefined) patch.periodo = input.periodo;
  if (input.unidad !== undefined) patch.unidad = input.unidad.trim();
  if (input.peso !== undefined) patch.peso = input.peso;

  const { error } = await supabase.from("meta_objetivos").update(patch).eq("id", objetivoId).eq("user_id", user.id);
  if (error) return { error: error.message };

  await recalcularProgresoMeta(supabase, user.id, actual.meta_id);
  revalidar();
  return {};
}

export async function eliminarObjetivo(objetivoId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: actual } = await supabase
    .from("meta_objetivos")
    .select("meta_id")
    .eq("id", objetivoId)
    .eq("user_id", user.id)
    .single();
  if (!actual) return { error: "No se encontró el objetivo." };

  const { error } = await supabase.from("meta_objetivos").delete().eq("id", objetivoId).eq("user_id", user.id);
  if (error) return { error: error.message };

  await recalcularProgresoMeta(supabase, user.id, actual.meta_id);
  revalidar();
  return {};
}

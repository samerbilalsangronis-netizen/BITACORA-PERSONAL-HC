"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/auth";
import type { EstadoMeta, TipoMeta } from "@/lib/supabase/types";

export async function createMeta(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const tipo = String(formData.get("tipo") || "corto_plazo") as TipoMeta;
  const fecha_inicio = String(formData.get("fecha_inicio") || "");
  const fecha_objetivo = String(formData.get("fecha_objetivo") || "") || null;

  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("metas").insert({
    user_id: user.id,
    titulo,
    descripcion,
    tipo,
    fecha_inicio: fecha_inicio || undefined,
    fecha_objetivo,
  });

  if (error) return { error: "No se pudo crear la meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: "Meta creada." };
}

export async function updateProgreso(metaId: string, progreso: number, nota?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const clamped = Math.max(0, Math.min(100, Math.round(progreso)));
  const estadoUpdate = clamped >= 100 ? { estado: "completada" as EstadoMeta } : {};

  const { error } = await supabase
    .from("metas")
    .update({ progreso: clamped, ...estadoUpdate })
    .eq("id", metaId)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar el progreso." };

  await supabase.from("meta_progreso_historial").insert({
    meta_id: metaId,
    user_id: user.id,
    progreso: clamped,
    nota: nota || null,
  });

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEstado(metaId: string, estado: EstadoMeta) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("metas")
    .update({ estado })
    .eq("id", metaId)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMeta(metaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("metas").delete().eq("id", metaId).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar la meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

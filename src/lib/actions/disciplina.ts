"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaHabito, Habito, TipoHabito } from "@/lib/supabase/types";

export interface HabitoInput {
  categoria: CategoriaHabito;
  tipo: TipoHabito;
  nombre: string;
  objetivo: number;
  unidad: string;
  icono: string;
  color: string;
  dias_semana: number[];
}

function revalidar() {
  revalidatePath("/disciplina");
  revalidatePath("/dashboard");
}

export async function createHabito(input: HabitoInput): Promise<{ error?: string; data?: Habito }> {
  const nombre = input.nombre.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (input.dias_semana.length === 0) return { error: "Elige al menos un día de la semana." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: ultimo } = await supabase
    .from("habitos")
    .select("orden")
    .eq("user_id", user.id)
    .eq("categoria", input.categoria)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("habitos")
    .insert({
      user_id: user.id,
      categoria: input.categoria,
      tipo: input.tipo,
      nombre,
      objetivo: Math.max(1, Math.round(input.objetivo)),
      unidad: input.unidad.trim(),
      icono: input.icono,
      color: input.color,
      dias_semana: input.dias_semana,
      orden: (ultimo?.orden ?? -1) + 1,
    })
    .select()
    .single();

  if (error || !data) return { error: "No se pudo crear." };

  revalidar();
  return { data: data as Habito };
}

export async function updateHabito(
  id: string,
  input: Partial<HabitoInput> & { orden?: number; activo?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  if (input.dias_semana && input.dias_semana.length === 0) return { error: "Elige al menos un día de la semana." };
  if (typeof input.nombre === "string" && !input.nombre.trim()) return { error: "El nombre es obligatorio." };

  const patch: Partial<Habito> = { ...input };
  if (typeof input.nombre === "string") patch.nombre = input.nombre.trim();
  if (typeof input.unidad === "string") patch.unidad = input.unidad.trim();
  if (typeof input.objetivo === "number") patch.objetivo = Math.max(1, Math.round(input.objetivo));

  const { error } = await supabase.from("habitos").update(patch).eq("id", id).eq("user_id", user.id);
  if (error) return { error: "No se pudo actualizar." };

  revalidar();
  return {};
}

export async function deleteHabito(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("habitos").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar." };

  revalidar();
  return {};
}

export async function registrarValor(habitoId: string, fecha: string, valor: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const clamped = Math.max(0, Math.round(valor));

  const { error } = await supabase.from("habito_registros").upsert(
    {
      habito_id: habitoId,
      user_id: user.id,
      fecha,
      valor: clamped,
      hora_completada: clamped > 0 ? new Date().toISOString() : null,
    },
    { onConflict: "habito_id,fecha" }
  );

  if (error) return { error: "No se pudo guardar el progreso." };

  revalidar();
  return {};
}

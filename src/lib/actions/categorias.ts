"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoTransaccion, CategoriaPersonalizada } from "@/lib/supabase/types";

export async function createCategoriaPersonalizada(
  tipo: TipoTransaccion,
  nombre: string,
  icono: string,
  color: string
): Promise<{ error?: string; data?: CategoriaPersonalizada }> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase
    .from("categorias_personalizadas")
    .insert({ user_id: user.id, tipo, nombre: nombreLimpio, icono, color })
    .select()
    .single();

  if (error || !data) return { error: "No se pudo crear la categoría." };

  revalidatePath("/finanzas");
  return { data: data as CategoriaPersonalizada };
}

export async function deleteCategoriaPersonalizada(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("categorias_personalizadas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo eliminar la categoría." };

  revalidatePath("/finanzas");
  return { success: true };
}

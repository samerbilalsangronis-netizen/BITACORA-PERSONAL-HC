"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createVisionItem(imagenUrl: string, titulo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("vision_board_items")
    .insert({ user_id: user.id, imagen_url: imagenUrl, titulo: titulo.trim() });

  if (error) return { error: "No se pudo guardar la imagen." };

  revalidatePath("/metas");
  return { success: true };
}

export async function deleteVisionItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("vision_board_items").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar la imagen." };

  revalidatePath("/metas");
  return { success: true };
}

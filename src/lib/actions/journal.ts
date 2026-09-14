"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/auth";
import type { Tipo } from "@/lib/supabase/types";

function parseEmociones(formData: FormData): string[] {
  return formData.getAll("emociones").map((v) => String(v));
}

export async function createEntry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const titulo = String(formData.get("titulo") || "").trim();
  const contenido = String(formData.get("contenido") || "");
  const tipo = String(formData.get("tipo") || "personal") as Tipo;
  const emociones = parseEmociones(formData);

  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, titulo, contenido, tipo, emociones })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la entrada." };

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  redirect(`/journal/${data.id}`);
}

export async function updateEntry(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const titulo = String(formData.get("titulo") || "").trim();
  const contenido = String(formData.get("contenido") || "");
  const tipo = String(formData.get("tipo") || "personal") as Tipo;
  const emociones = parseEmociones(formData);

  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("journal_entries")
    .update({ titulo, contenido, tipo, emociones })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo actualizar la entrada." };

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  revalidatePath("/dashboard");
  redirect(`/journal/${id}`);
}

export async function deleteEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar la entrada." };

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  redirect("/journal");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/auth";

export async function changePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== passwordConfirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo actualizar la contraseña." };

  return { success: "Contraseña actualizada correctamente." };
}

export async function updateReminderSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const reminder_time = String(formData.get("reminder_time") || "08:00");
  const reminder_enabled = formData.get("reminder_enabled") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ reminder_time, reminder_enabled })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/perfil");
  return { success: "Recordatorio actualizado." };
}

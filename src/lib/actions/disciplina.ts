"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TareaDiaria } from "@/lib/supabase/types";

export async function saveDailyTasks(fecha: string, tareas: TareaDiaria[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("daily_tasks")
    .upsert({ user_id: user.id, fecha, tareas }, { onConflict: "user_id,fecha" });

  if (error) return { error: "No se pudieron guardar las tareas." };

  revalidatePath("/disciplina");
  revalidatePath("/dashboard");
  return { success: true };
}

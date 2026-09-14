import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DailyTasks } from "@/lib/supabase/types";

export async function ensureDailyTasks(
  supabase: SupabaseClient<Database>,
  userId: string,
  fecha: string
): Promise<DailyTasks> {
  const { data: existing } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (existing) return existing;

  const { data: previous } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .lt("fecha", fecha)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tareas = (previous?.tareas ?? []).map((t) => ({
    ...t,
    completada: false,
    hora_completada: null,
  }));

  const { data: inserted, error } = await supabase
    .from("daily_tasks")
    .upsert({ user_id: userId, fecha, tareas }, { onConflict: "user_id,fecha" })
    .select("*")
    .single();

  if (error || !inserted) {
    const { data: fallback } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("fecha", fecha)
      .single();
    return fallback as DailyTasks;
  }

  return inserted;
}

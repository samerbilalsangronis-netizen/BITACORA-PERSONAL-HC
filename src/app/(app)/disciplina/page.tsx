import { requireUser } from "@/lib/session";
import { DisciplinaTabs } from "@/components/disciplina/DisciplinaTabs";
import { FormError } from "@/components/ui/FormMessage";
import { daysAgoISO } from "@/lib/utils";
import { todayISOForUser } from "@/lib/server-date";
import type { Habito, HabitoRegistro } from "@/lib/supabase/types";

export default async function DisciplinaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;
  const today = await todayISOForUser();
  const fecha = fechaParam && fechaParam <= today ? fechaParam : today;

  const { supabase, user } = await requireUser();

  const [habitosRes, registrosRes] = await Promise.all([
    supabase.from("habitos").select("*").eq("user_id", user.id).order("categoria").order("orden"),
    supabase
      .from("habito_registros")
      .select("*")
      .eq("user_id", user.id)
      .gte("fecha", daysAgoISO(371, today))
      .lte("fecha", today),
  ]);

  const habitos = (habitosRes.data ?? []) as Habito[];
  const registros = (registrosRes.data ?? []) as HabitoRegistro[];
  const loadError = habitosRes.error?.message ?? registrosRes.error?.message;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Disciplina diaria</h1>
        <p className="text-sm text-muted">Tareas y hábitos programados por día, con racha y objetivos por ítem.</p>
      </div>
      <FormError message={loadError} />
      <DisciplinaTabs habitos={habitos} registros={registros} fecha={fecha} today={today} />
    </div>
  );
}

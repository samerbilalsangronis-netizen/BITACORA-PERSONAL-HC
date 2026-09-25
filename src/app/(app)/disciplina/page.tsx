import { requireUser } from "@/lib/session";
import { ensureDailyTasks } from "@/lib/disciplina-data";
import { DisciplinaBoard } from "@/components/disciplina/DisciplinaBoard";
import { WeeklySummary } from "@/components/disciplina/WeeklySummary";
import { daysAgoISO } from "@/lib/utils";
import { todayISOForUser } from "@/lib/server-date";

export default async function DisciplinaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParam } = await searchParams;
  const today = await todayISOForUser();
  const fecha = fechaParam && fechaParam <= today ? fechaParam : today;

  const { supabase, user } = await requireUser();
  const dailyTasks = await ensureDailyTasks(supabase, user.id, fecha);

  const { data: stats } = await supabase
    .from("disciplina_stats")
    .select("*")
    .eq("user_id", user.id)
    .gte("fecha", daysAgoISO(6, today))
    .lte("fecha", today);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Disciplina diaria</h1>
        <p className="text-sm text-muted">Define tus tareas del día y marca tu cumplimiento.</p>
      </div>
      <DisciplinaBoard fecha={fecha} initialTareas={dailyTasks.tareas} />
      <WeeklySummary stats={stats ?? []} />
    </div>
  );
}

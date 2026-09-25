import Link from "next/link";
import { NotebookPen, Target, Flame, Percent, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { StatCard } from "@/components/ui/StatCard";
import { DisciplinaAreaChart } from "@/components/dashboard/DisciplinaAreaChart";
import { HeatmapCalendar } from "@/components/dashboard/HeatmapCalendar";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { EmotionPieChart } from "@/components/dashboard/EmotionPieChart";
import { MetasSummary } from "@/components/dashboard/MetasSummary";
import { JournalPreview } from "@/components/dashboard/JournalPreview";
import { computeStreak, daysAgoISO } from "@/lib/utils";
import { computeStatsDiarios } from "@/lib/habitos";
import { todayISOForUser } from "@/lib/server-date";
import type { Meta, JournalEntry, Habito, HabitoRegistro, Transaccion } from "@/lib/supabase/types";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser();
  const today = await todayISOForUser();
  const inicioMes = today.slice(0, 8) + "01";
  const desde125 = daysAgoISO(125, today);

  const [habitosRes, registrosRes, metasRes, journalCountRes, latestEntryRes, emocionesRes, transaccionesMesRes, metasFechaRes] =
    await Promise.all([
      supabase.from("habitos").select("*").eq("user_id", user.id),
      supabase.from("habito_registros").select("*").eq("user_id", user.id).gte("fecha", desde125).lte("fecha", today),
      supabase.from("metas").select("*").eq("user_id", user.id).eq("estado", "activa").order("created_at", { ascending: false }),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("journal_entries").select("emociones").eq("user_id", user.id).limit(500),
      supabase.from("transacciones").select("*").eq("user_id", user.id).gte("fecha", inicioMes),
      supabase.from("metas").select("id,titulo,fecha_objetivo").eq("user_id", user.id).not("fecha_objetivo", "is", null),
    ]);

  const habitos = (habitosRes.data ?? []) as Habito[];
  const registros = (registrosRes.data ?? []) as HabitoRegistro[];
  const fechasStats = Array.from({ length: 126 }, (_, i) => daysAgoISO(125 - i, today));
  const stats = computeStatsDiarios(habitos, registros, fechasStats);

  const metasActivas = (metasRes.data ?? []) as Meta[];
  const totalMetasRes = await supabase.from("metas").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const latestEntry = (latestEntryRes.data ?? null) as JournalEntry | null;
  const emociones = (emocionesRes.data ?? []).map((e) => e.emociones as string[]);
  const transaccionesMes = (transaccionesMesRes.data ?? []) as Transaccion[];
  const balanceMes = transaccionesMes.reduce((s, t) => s + (t.tipo === "ingreso" ? t.monto : -t.monto), 0);
  const metasConFecha = (metasFechaRes.data ?? []) as { id: string; titulo: string; fecha_objetivo: string }[];

  const statsHoy = stats.find((s) => s.fecha === today);
  const totalTareas = statsHoy?.tareas_totales ?? 0;
  const completadasHoy = statsHoy?.tareas_completadas ?? 0;
  const porcentajeHoy = statsHoy?.porcentaje_cumplimiento ?? 0;
  const streak = computeStreak(stats, today);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hola, {profile?.nombre || "trader"} 👋</h1>
        <p className="text-sm text-muted">Este es tu resumen de disciplina y bitácora.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Disciplina hoy" value={`${Math.round(porcentajeHoy)}%`} icon={Percent} hint={`${completadasHoy}/${totalTareas} tareas`} />
        <StatCard label="Racha días completos" value={streak} icon={Flame} hint="días al 100%" />
        <StatCard label="Entradas de journal" value={journalCountRes.count ?? 0} icon={NotebookPen} />
        <StatCard label="Metas totales" value={totalMetasRes.count ?? 0} icon={Target} hint={`${metasActivas.length} activas`} />
        <Link href="/finanzas">
          <StatCard label="Balance del mes" value={formatoMonto.format(balanceMes)} icon={Wallet} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DisciplinaAreaChart stats={stats} />
        </div>
        <MetasSummary metas={metasActivas} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCalendar habitos={habitos} registros={registros} metas={metasConFecha} today={today} />
        <HeatmapCalendar stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <JournalPreview entry={latestEntry} />
        <EmotionPieChart emociones={emociones} />
      </div>
    </div>
  );
}

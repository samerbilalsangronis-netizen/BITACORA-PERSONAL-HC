import { Suspense } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { StatCard } from "@/components/ui/StatCard";
import { FinanzasResumen } from "@/components/finanzas/FinanzasResumen";
import { FinanzasFilters } from "@/components/finanzas/FinanzasFilters";
import { TransaccionesColumna } from "@/components/finanzas/TransaccionesColumna";
import { FinanzasBarChart } from "@/components/finanzas/FinanzasBarChart";
import type { CategoriaPersonalizada, Transaccion } from "@/lib/supabase/types";
import { daysAgoISO } from "@/lib/utils";
import { todayISOForUser } from "@/lib/server-date";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; desde?: string; hasta?: string }>;
}) {
  const { categoria, desde, hasta } = await searchParams;
  const { supabase, user } = await requireUser();
  const today = await todayISOForUser();

  let query = supabase.from("transacciones").select("*").eq("user_id", user.id);
  if (categoria) query = query.eq("categoria", categoria);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const [{ data: chartData }, { data }, { data: categoriasData }] = await Promise.all([
    supabase
      .from("transacciones")
      .select("*")
      .eq("user_id", user.id)
      .gte("fecha", daysAgoISO(730, today))
      .order("fecha", { ascending: true }),
    query.order("fecha", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("categorias_personalizadas").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  const transacciones = (data ?? []) as Transaccion[];
  const todas = (chartData ?? []) as Transaccion[];
  const categoriasPersonalizadas = (categoriasData ?? []) as CategoriaPersonalizada[];

  const ingresos = transacciones.filter((t) => t.tipo === "ingreso");
  const gastos = transacciones.filter((t) => t.tipo === "egreso");

  const inicioMesISO = today.slice(0, 8) + "01";
  const delMes = todas.filter((t) => t.fecha >= inicioMesISO);
  const ingresosMes = delMes.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0);
  const egresosMes = delMes.filter((t) => t.tipo === "egreso").reduce((s, t) => s + t.monto, 0);
  const balanceMes = ingresosMes - egresosMes;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Gestor financiero</h1>
        <p className="text-sm text-muted">Registra tus ingresos y egresos para saber en qué usas tu dinero.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos del mes" value={formatoMonto.format(ingresosMes)} icon={TrendingUp} />
        <StatCard label="Egresos del mes" value={formatoMonto.format(egresosMes)} icon={TrendingDown} />
        <StatCard label="Balance del mes" value={formatoMonto.format(balanceMes)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinanzasResumen transacciones={todas} categoriasPersonalizadas={categoriasPersonalizadas} today={today} />
        <FinanzasBarChart transacciones={todas} />
      </div>

      <Suspense fallback={null}>
        <FinanzasFilters />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransaccionesColumna
          tipo="ingreso"
          transacciones={ingresos}
          categoriasPersonalizadas={categoriasPersonalizadas}
          today={today}
        />
        <TransaccionesColumna
          tipo="egreso"
          transacciones={gastos}
          categoriasPersonalizadas={categoriasPersonalizadas}
          today={today}
        />
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { StatCard } from "@/components/ui/StatCard";
import { NuevaTransaccionForm } from "@/components/finanzas/NuevaTransaccionForm";
import { FinanzasFilters } from "@/components/finanzas/FinanzasFilters";
import { TransaccionRow } from "@/components/finanzas/TransaccionRow";
import { FinanzasBarChart } from "@/components/finanzas/FinanzasBarChart";
import { CategoriaPieChart } from "@/components/finanzas/CategoriaPieChart";
import type { Transaccion, TipoTransaccion } from "@/lib/supabase/types";
import { daysAgoISO } from "@/lib/utils";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; categoria?: string; desde?: string; hasta?: string }>;
}) {
  const { tipo, categoria, desde, hasta } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: chartData } = await supabase
    .from("transacciones")
    .select("*")
    .eq("user_id", user.id)
    .gte("fecha", daysAgoISO(180))
    .order("fecha", { ascending: true });

  let query = supabase.from("transacciones").select("*").eq("user_id", user.id);
  if (tipo) query = query.eq("tipo", tipo as TipoTransaccion);
  if (categoria) query = query.eq("categoria", categoria);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data } = await query.order("fecha", { ascending: false }).order("created_at", { ascending: false });
  const transacciones = (data ?? []) as Transaccion[];
  const todas = (chartData ?? []) as Transaccion[];

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const inicioMesISO = inicioMes.toISOString().slice(0, 10);
  const delMes = todas.filter((t) => t.fecha >= inicioMesISO);
  const ingresosMes = delMes.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0);
  const egresosMes = delMes.filter((t) => t.tipo === "egreso").reduce((s, t) => s + t.monto, 0);
  const balanceMes = ingresosMes - egresosMes;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Gestor financiero</h1>
          <p className="text-sm text-muted">Registra tus ingresos y egresos para saber en qué usas tu dinero.</p>
        </div>
        <NuevaTransaccionForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos del mes" value={formatoMonto.format(ingresosMes)} icon={TrendingUp} />
        <StatCard label="Egresos del mes" value={formatoMonto.format(egresosMes)} icon={TrendingDown} />
        <StatCard label="Balance del mes" value={formatoMonto.format(balanceMes)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinanzasBarChart transacciones={todas} />
        <CategoriaPieChart transacciones={todas} />
      </div>

      <Suspense fallback={null}>
        <FinanzasFilters />
      </Suspense>

      {transacciones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No hay transacciones que coincidan con tu búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface px-4">
          {transacciones.map((t, i) => (
            <TransaccionRow key={t.id} transaccion={t} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

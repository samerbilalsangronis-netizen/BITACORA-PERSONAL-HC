"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { resolveCategoriaVisual } from "@/lib/constants";
import { cn, daysAgoISO, labelize } from "@/lib/utils";
import type { CategoriaPersonalizada, Transaccion, TipoTransaccion } from "@/lib/supabase/types";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

type Periodo = "dia" | "semana" | "mes" | "año" | "periodo";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "año", label: "Año" },
  { value: "periodo", label: "Período" },
];

const PERIODO_LABEL: Record<Periodo, string> = {
  dia: "día",
  semana: "semana",
  mes: "mes",
  año: "año",
  periodo: "período",
};

function toDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, months: number) {
  const d = toDate(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toISO(d);
}
function addYears(iso: string, years: number) {
  const d = toDate(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toISO(d);
}
function startOfWeek(iso: string) {
  const d = toDate(iso);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return toISO(d);
}
function startOfMonth(iso: string) {
  return iso.slice(0, 8) + "01";
}
function endOfMonth(iso: string) {
  const d = toDate(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return toISO(d);
}
function formatShort(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(toDate(iso));
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FinanzasResumen({
  transacciones,
  categoriasPersonalizadas,
  today,
  onAdd,
}: {
  transacciones: Transaccion[];
  categoriasPersonalizadas: CategoriaPersonalizada[];
  today: string;
  onAdd: () => void;
}) {
  const [tipo, setTipo] = useState<TipoTransaccion>("egreso");
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [offset, setOffset] = useState(0);
  const [customDesde, setCustomDesde] = useState("");
  const [customHasta, setCustomHasta] = useState("");

  const anchor = useMemo(() => {
    if (periodo === "dia") return daysAgoISO(-offset, today);
    if (periodo === "semana") return daysAgoISO(-offset * 7, today);
    if (periodo === "mes") return addMonths(today, offset);
    if (periodo === "año") return addYears(today, offset);
    return today;
  }, [periodo, offset, today]);

  const range = useMemo((): { start: string | null; end: string | null } => {
    if (periodo === "periodo") return { start: customDesde || null, end: customHasta || null };
    if (periodo === "dia") return { start: anchor, end: anchor };
    if (periodo === "semana") {
      const s = startOfWeek(anchor);
      return { start: s, end: daysAgoISO(-6, s) };
    }
    if (periodo === "mes") return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    return { start: anchor.slice(0, 4) + "-01-01", end: anchor.slice(0, 4) + "-12-31" };
  }, [periodo, anchor, customDesde, customHasta]);

  const rangeLabel = useMemo(() => {
    if (periodo === "dia") {
      return capitalize(
        new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(toDate(anchor))
      );
    }
    if (periodo === "semana" && range.start && range.end) return `${formatShort(range.start)} – ${formatShort(range.end)}`;
    if (periodo === "mes") return capitalize(new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(toDate(anchor)));
    if (periodo === "año") return anchor.slice(0, 4);
    return range.start && range.end ? `${formatShort(range.start)} – ${formatShort(range.end)}` : "Elige un rango";
  }, [periodo, anchor, range]);

  const filtradas = useMemo(
    () =>
      transacciones.filter((t) => {
        if (t.tipo !== tipo) return false;
        if (range.start && t.fecha < range.start) return false;
        if (range.end && t.fecha > range.end) return false;
        return true;
      }),
    [transacciones, tipo, range]
  );

  const total = filtradas.reduce((s, t) => s + t.monto, 0);

  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of filtradas) totals.set(t.categoria, (totals.get(t.categoria) ?? 0) + t.monto);
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, value]) => ({
        categoria,
        value: Math.round(value * 100) / 100,
        color: resolveCategoriaVisual(categoria, categoriasPersonalizadas).color,
      }));
  }, [filtradas, categoriasPersonalizadas]);

  const pieData = data.length > 0 ? data : [{ categoria: "vacio", value: 1, color: "var(--border)" }];
  const tipoLabel = tipo === "egreso" ? "gastos" : "ingresos";

  function changePeriodo(p: Periodo) {
    setPeriodo(p);
    setOffset(0);
  }

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {(["egreso", "ingreso"] as TipoTransaccion[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 font-medium transition-colors",
              tipo === t ? "bg-surface border border-border text-foreground" : "text-muted"
            )}
          >
            {t === "egreso" ? "Gastos" : "Ingresos"}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => changePeriodo(p.value)}
            className={cn(
              "border-b-2 pb-1 font-medium transition-colors",
              periodo === p.value ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === "periodo" ? (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Input type="date" value={customDesde} onChange={(e) => setCustomDesde(e.target.value)} aria-label="Desde" />
          <Input type="date" value={customHasta} onChange={(e) => setCustomHasta(e.target.value)} aria-label="Hasta" />
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-center gap-3 text-sm text-muted">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Período anterior"
            className="rounded-md p-1 hover:bg-surface-muted"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium text-foreground">{rangeLabel}</span>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            aria-label="Período siguiente"
            className="rounded-md p-1 hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="relative mx-auto h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="categoria"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
            >
              {pieData.map((entry, i) => (
                <Cell key={entry.categoria + i} fill={entry.color} />
              ))}
            </Pie>
            {data.length > 0 && (
              <Tooltip
                formatter={(value, name) => [formatoMonto.format(Number(value)), labelize(String(name))]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          {data.length === 0 ? (
            <p className="text-sm font-medium text-muted">
              No hubo {tipoLabel}
              <br />
              este {PERIODO_LABEL[periodo]}
            </p>
          ) : (
            <p className="text-xl font-semibold tabular-nums">{formatoMonto.format(total)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Nueva transacción"
          className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform duration-150 hover:opacity-90 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {data.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.slice(0, 6).map((d) => {
            const { Icon } = resolveCategoriaVisual(d.categoria, categoriasPersonalizadas);
            return (
              <li key={d.categoria} className="flex items-center gap-2 text-sm">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${d.color}20`, color: d.color }}
                >
                  <Icon size={13} />
                </span>
                <span className="flex-1 truncate">{labelize(d.categoria)}</span>
                <span className="tabular-nums text-muted">{formatoMonto.format(d.value)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ICONO_MAP } from "@/lib/constants";
import { estaCreadoPara, estaCumplido, estaProgramado, indexarRegistros } from "@/lib/habitos";
import { Card } from "@/components/ui/Card";
import { cn, daysAgoISO, formatDate } from "@/lib/utils";
import type { Habito, HabitoRegistro } from "@/lib/supabase/types";

type Rango = "semana" | "mes" | "año";

const RANGOS: { value: Rango; label: string; semanas: number }[] = [
  { value: "semana", label: "Semana", semanas: 1 },
  { value: "mes", label: "Mes", semanas: 5 },
  { value: "año", label: "Año", semanas: 53 },
];

export function HabitosInforme({
  habitos,
  registros,
  today,
}: {
  habitos: Habito[];
  registros: HabitoRegistro[];
  today: string;
}) {
  const [rango, setRango] = useState<Rango>("semana");
  const valorPorFecha = useMemo(() => indexarRegistros(registros), [registros]);
  const semanas = RANGOS.find((r) => r.value === rango)!.semanas;

  const dias = useMemo(() => {
    const totalDias = semanas * 7;
    const todayDate = new Date(`${today}T00:00:00`);
    const todayDow = (todayDate.getDay() + 6) % 7; // lunes = 0
    const startOffset = totalDias - 1 - todayDow;
    return Array.from({ length: totalDias }, (_, i) => daysAgoISO(startOffset - i, today));
  }, [semanas, today]);

  const semanasGrid = useMemo(() => {
    const cols: string[][] = [];
    for (let i = 0; i < dias.length; i += 7) cols.push(dias.slice(i, i + 7));
    return cols;
  }, [dias]);

  const activos = useMemo(() => habitos.filter((h) => h.activo), [habitos]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Informe de hábitos</h2>
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-xs">
          {RANGOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRango(r.value)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                rango === r.value ? "bg-surface border border-border text-foreground" : "text-muted"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {activos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Todavía no tienes tareas ni hábitos activos para mostrar en el informe.
        </p>
      ) : (
        <div className="space-y-5">
          {activos.map((h) => {
            const Icon = ICONO_MAP[h.icono] ?? ICONO_MAP.otro;
            const programados = dias.filter((f) => estaCreadoPara(h, f) && estaProgramado(h, f) && f <= today);
            const cumplidos = programados.filter((f) => estaCumplido(h, valorPorFecha.get(`${h.id}|${f}`) ?? 0));
            const pct = programados.length === 0 ? null : Math.round((cumplidos.length / programados.length) * 100);

            return (
              <div key={h.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${h.color}20`, color: h.color }}
                    >
                      <Icon size={12} />
                    </span>
                    <span className="truncate text-sm font-medium">{h.nombre}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                </div>
                <div className="flex gap-[3px] overflow-x-auto pb-1 scrollbar-thin">
                  {semanasGrid.map((semana, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {semana.map((fecha) => {
                        const enRango = estaCreadoPara(h, fecha) && estaProgramado(h, fecha);
                        const futura = fecha > today;
                        const cumplida = enRango && estaCumplido(h, valorPorFecha.get(`${h.id}|${fecha}`) ?? 0);
                        return (
                          <div
                            key={fecha}
                            title={enRango && !futura ? `${formatDate(fecha)}: ${cumplida ? "cumplido" : "no cumplido"}` : undefined}
                            className="h-3 w-3 rounded-[2px]"
                            style={{
                              background: !enRango || futura ? "var(--surface-muted)" : cumplida ? h.color : `${h.color}25`,
                              opacity: !enRango ? 0.25 : 1,
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

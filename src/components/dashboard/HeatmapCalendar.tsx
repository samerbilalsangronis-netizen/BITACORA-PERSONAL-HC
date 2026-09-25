"use client";

import { useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { daysAgoISO, formatDate } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";
import { heatmapColor } from "@/lib/palette";
import type { DiaStat } from "@/lib/habitos";

const WEEKS = 18;
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export function HeatmapCalendar({ stats }: { stats: DiaStat[] }) {
  const theme = useTheme();
  const byFecha = useMemo(() => new Map(stats.map((s) => [s.fecha, s.porcentaje_cumplimiento])), [stats]);

  const totalDays = WEEKS * 7;
  const today = new Date(`${daysAgoISO(0)}T00:00:00`);
  const todayDow = (today.getDay() + 6) % 7; // lunes = 0
  const startOffset = totalDays - 1 - todayDow;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const fecha = daysAgoISO(startOffset - i);
    return { fecha, pct: byFecha.get(fecha) ?? (fecha > daysAgoISO(0) ? null : 0) };
  });

  const weeks: (typeof days)[number][][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <Card>
      <CardTitle className="mb-4">Historial de cumplimiento</CardTitle>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex flex-col justify-between py-1 text-[10px] text-muted">
          {DAY_LABELS.map((d) => (
            <span key={d} className="h-3.5 leading-[14px]">
              {d}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.fecha}
                title={day.pct === null ? formatDate(day.fecha) : `${formatDate(day.fecha)}: ${Math.round(day.pct)}%`}
                className="h-3.5 w-3.5 rounded-[3px]"
                style={{
                  background: day.pct === null ? "transparent" : heatmapColor(day.pct, theme),
                  opacity: day.pct === null ? 0 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
        <LegendDot color={heatmapColor(0, theme)} label="0%" />
        <LegendDot color={heatmapColor(30, theme)} label="1-49%" />
        <LegendDot color={heatmapColor(70, theme)} label="50-99%" />
        <LegendDot color={heatmapColor(100, theme)} label="100%" />
      </div>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}

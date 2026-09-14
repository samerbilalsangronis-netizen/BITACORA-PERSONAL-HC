"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn, daysAgoISO, formatDate } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";
import { CHART_CHROME, SEQUENTIAL_BLUE } from "@/lib/palette";
import type { DisciplinaStats } from "@/lib/supabase/types";

const RANGES = [30, 60, 90] as const;

export function DisciplinaAreaChart({ stats }: { stats: DisciplinaStats[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const theme = useTheme();
  const color = SEQUENTIAL_BLUE[theme];
  const chrome = CHART_CHROME[theme];

  const data = useMemo(() => {
    const byFecha = new Map(stats.map((s) => [s.fecha, s]));
    return Array.from({ length: range }, (_, i) => {
      const fecha = daysAgoISO(range - 1 - i);
      return {
        fecha,
        label: formatDate(fecha),
        porcentaje: byFecha.get(fecha)?.porcentaje_cumplimiento ?? 0,
      };
    });
  }, [stats, range]);

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <CardTitle>Cumplimiento de disciplina</CardTitle>
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-xs">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                range === r ? "bg-surface shadow-sm text-foreground" : "text-muted"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="disciplinaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: chrome.muted }}
              axisLine={{ stroke: chrome.axis }}
              tickLine={false}
              interval={Math.ceil(range / 6)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: chrome.muted }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`${value}%`, "Cumplimiento"]}
            />
            <Area
              type="monotone"
              dataKey="porcentaje"
              stroke={color}
              strokeWidth={2}
              fill="url(#disciplinaFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

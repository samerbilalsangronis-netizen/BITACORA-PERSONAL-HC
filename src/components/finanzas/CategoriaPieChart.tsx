"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/lib/useTheme";
import { CATEGORICAL, CATEGORICAL_OTHER } from "@/lib/palette";
import { labelize } from "@/lib/utils";
import type { Transaccion } from "@/lib/supabase/types";

const MAX_SLICES = 7;

export function CategoriaPieChart({ transacciones }: { transacciones: Transaccion[] }) {
  const theme = useTheme();
  const palette = CATEGORICAL[theme];

  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transacciones) {
      if (t.tipo !== "egreso") continue;
      totals.set(t.categoria, (totals.get(t.categoria) ?? 0) + t.monto);
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, MAX_SLICES);
    const rest = sorted.slice(MAX_SLICES).reduce((sum, [, v]) => sum + v, 0);
    const result = top.map(([name, value]) => ({ name: labelize(name), value: Math.round(value * 100) / 100 }));
    if (rest > 0) result.push({ name: "Otras", value: Math.round(rest * 100) / 100 });
    return result;
  }, [transacciones]);

  if (data.length === 0) {
    return (
      <Card>
        <CardTitle className="mb-4">Egresos por categoría</CardTitle>
        <p className="py-10 text-center text-sm text-muted">Aún no hay egresos registrados.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="mb-4">Egresos por categoría</CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === "Otras" ? CATEGORICAL_OTHER[theme] : palette[i % palette.length]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => `$${value}`}
            />
            <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

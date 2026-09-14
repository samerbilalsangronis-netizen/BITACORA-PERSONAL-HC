"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/lib/useTheme";
import { CATEGORICAL, CATEGORICAL_OTHER } from "@/lib/palette";
import { labelize } from "@/lib/utils";

const MAX_SLICES = 7;

export function EmotionPieChart({ emociones }: { emociones: string[][] }) {
  const theme = useTheme();
  const palette = CATEGORICAL[theme];

  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const list of emociones) {
      for (const e of list) counts.set(e, (counts.get(e) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, MAX_SLICES);
    const rest = sorted.slice(MAX_SLICES).reduce((sum, [, c]) => sum + c, 0);
    const result = top.map(([name, value]) => ({ name: labelize(name), value }));
    if (rest > 0) result.push({ name: "Otras", value: rest });
    return result;
  }, [emociones]);

  if (data.length === 0) {
    return (
      <Card>
        <CardTitle className="mb-4">Distribución de emociones</CardTitle>
        <p className="py-10 text-center text-sm text-muted">Aún no hay suficientes entradas de journal.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="mb-4">Distribución de emociones</CardTitle>
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
            />
            <Legend
              verticalAlign="bottom"
              height={48}
              wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

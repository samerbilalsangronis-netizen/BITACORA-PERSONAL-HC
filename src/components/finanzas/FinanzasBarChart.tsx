"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/lib/useTheme";
import { CATEGORICAL, CHART_CHROME } from "@/lib/palette";
import type { Transaccion } from "@/lib/supabase/types";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function FinanzasBarChart({ transacciones }: { transacciones: Transaccion[] }) {
  const theme = useTheme();
  const palette = CATEGORICAL[theme];
  const chrome = CHART_CHROME[theme];

  const data = useMemo(() => {
    const now = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
    });
    const totals = new Map(meses.map((m) => [m.key, { ingresos: 0, egresos: 0 }]));

    for (const t of transacciones) {
      const d = new Date(`${t.fecha}T00:00:00`);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = totals.get(key);
      if (!bucket) continue;
      if (t.tipo === "ingreso") bucket.ingresos += t.monto;
      else bucket.egresos += t.monto;
    }

    return meses.map((m) => ({ label: m.label, ...totals.get(m.key)! }));
  }, [transacciones]);

  return (
    <Card>
      <CardTitle className="mb-4">Ingresos vs. egresos (6 meses)</CardTitle>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: chrome.muted }} axisLine={{ stroke: chrome.axis }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: chrome.muted }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => `$${value}`}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
            <Bar dataKey="ingresos" name="Ingresos" fill={palette[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" name="Egresos" fill={palette[7]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

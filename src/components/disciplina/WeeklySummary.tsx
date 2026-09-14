import { Card, CardTitle } from "@/components/ui/Card";
import { cn, daysAgoISO, formatDate } from "@/lib/utils";
import type { DisciplinaStats } from "@/lib/supabase/types";

function barColor(pct: number) {
  if (pct >= 100) return "bg-accent";
  if (pct >= 50) return "bg-warning";
  if (pct > 0) return "bg-danger";
  return "bg-surface-muted";
}

export function WeeklySummary({ stats }: { stats: DisciplinaStats[] }) {
  const days = Array.from({ length: 7 }, (_, i) => daysAgoISO(6 - i));
  const byFecha = new Map(stats.map((s) => [s.fecha, s]));

  return (
    <Card>
      <CardTitle className="mb-4">Últimos 7 días</CardTitle>
      <div className="flex items-end justify-between gap-2">
        {days.map((fecha) => {
          const stat = byFecha.get(fecha);
          const pct = stat?.porcentaje_cumplimiento ?? 0;
          return (
            <div key={fecha} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-surface-muted">
                <div
                  className={cn("w-full transition-all", barColor(pct))}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted">{formatDate(fecha).slice(0, 6)}</span>
              <span className="text-xs font-semibold">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

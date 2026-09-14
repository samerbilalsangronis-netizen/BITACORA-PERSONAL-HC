import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import type { Meta } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function MetasSummary({ metas }: { metas: Meta[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>Metas activas</CardTitle>
        <Link href="/metas" className="text-xs font-medium text-primary hover:underline">
          Ver todas
        </Link>
      </div>
      {metas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No tienes metas activas. Crea una en la sección Metas.</p>
      ) : (
        <div className="space-y-4">
          {metas.slice(0, 4).map((meta) => (
            <div key={meta.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{meta.titulo}</span>
                <span className="text-muted">{meta.progreso}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn("h-full rounded-full", meta.progreso >= 100 ? "bg-accent" : "bg-primary")}
                  style={{ width: `${meta.progreso}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

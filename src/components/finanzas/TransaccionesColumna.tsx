"use client";

import { useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { NuevaTransaccionForm } from "@/components/finanzas/NuevaTransaccionForm";
import { TransaccionRow } from "@/components/finanzas/TransaccionRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { CategoriaPersonalizada, Cuenta, Transaccion, TipoTransaccion } from "@/lib/supabase/types";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export function TransaccionesColumna({
  tipo,
  transacciones,
  categoriasPersonalizadas,
  cuentas,
  today,
}: {
  tipo: TipoTransaccion;
  transacciones: Transaccion[];
  categoriasPersonalizadas: CategoriaPersonalizada[];
  cuentas: Cuenta[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const esIngreso = tipo === "ingreso";
  const total = transacciones.reduce((s, t) => s + t.monto, 0);

  return (
    <div className="space-y-4">
      <Card className={cn("border-t-4", esIngreso ? "border-t-accent" : "border-t-danger")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                esIngreso ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
              )}
            >
              {esIngreso ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
            <div>
              <h2 className="text-sm font-semibold">{esIngreso ? "Ingresos" : "Gastos"}</h2>
              <p className={cn("text-sm font-semibold tabular-nums", esIngreso ? "text-accent" : "text-danger")}>
                {formatoMonto.format(total)}
              </p>
            </div>
          </div>
          <Button size="sm" variant={esIngreso ? "primary" : "danger"} onClick={() => setOpen(true)}>
            <Plus size={14} />
            Nuevo
          </Button>
        </div>
      </Card>

      {open && (
        <NuevaTransaccionForm
          tipo={tipo}
          categoriasPersonalizadas={categoriasPersonalizadas}
          cuentas={cuentas}
          today={today}
          onClose={() => setOpen(false)}
        />
      )}

      {transacciones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No hay {esIngreso ? "ingresos" : "gastos"} que coincidan con tu búsqueda.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface px-4">
          {transacciones.map((t, i) => (
            <TransaccionRow
              key={t.id}
              transaccion={t}
              categoriasPersonalizadas={categoriasPersonalizadas}
              cuentas={cuentas}
              index={i}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ajustarSaldoCuenta, deleteCuenta } from "@/lib/actions/cuentas";
import { NuevaCuentaForm } from "@/components/finanzas/NuevaCuentaForm";
import { ICONO_MAP, TIPOS_CUENTA } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";
import type { Cuenta } from "@/lib/supabase/types";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export function CuentasPanel({ cuentasIniciales }: { cuentasIniciales: Cuenta[] }) {
  const [cuentas, setCuentas] = useState(cuentasIniciales);
  const [formAbierto, setFormAbierto] = useState<"nueva" | string | null>(null);
  const [ajustandoId, setAjustandoId] = useState<string | null>(null);
  const [nuevoSaldo, setNuevoSaldo] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = cuentas.reduce((s, c) => s + c.saldo, 0);

  function empezarAjuste(c: Cuenta) {
    setError(undefined);
    setAjustandoId(c.id);
    setNuevoSaldo(String(c.saldo));
  }

  function confirmarAjuste(id: string) {
    const valor = Number(nuevoSaldo);
    if (!Number.isFinite(valor)) {
      setError("Ingresa un número válido.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await ajustarSaldoCuenta(id, valor);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, saldo: valor } : c)));
      setAjustandoId(null);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta? Las transacciones ya registradas no se borrarán, solo quedarán sin cuenta asignada.")) return;
    setError(undefined);
    startTransition(async () => {
      const result = await deleteCuenta(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCuentas((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    });
  }

  return (
    <Card className={cn(isPending && "opacity-80")}>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Capital total</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setFormAbierto((f) => (f === "nueva" ? null : "nueva"))}
        >
          <Plus size={14} /> Cuenta
        </Button>
      </div>
      <p className="mb-4 text-2xl font-semibold tabular-nums">{formatoMonto.format(total)}</p>

      {formAbierto === "nueva" && (
        <div className="mb-4">
          <NuevaCuentaForm onClose={() => setFormAbierto(null)} onSaved={(c) => setCuentas((prev) => [...prev, c])} />
        </div>
      )}

      {cuentas.length === 0 && formAbierto !== "nueva" ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
          Agrega tus cuentas (banco, efectivo, broker…) para llevar el registro de dónde está tu capital.
        </p>
      ) : (
        <div className="space-y-2">
          {cuentas.map((c) => {
            if (formAbierto === c.id) {
              return (
                <NuevaCuentaForm
                  key={c.id}
                  cuenta={c}
                  onClose={() => setFormAbierto(null)}
                  onSaved={(actualizada) =>
                    setCuentas((prev) => prev.map((x) => (x.id === actualizada.id ? actualizada : x)))
                  }
                />
              );
            }

            const Icon = ICONO_MAP[c.icono] ?? ICONO_MAP.otro;
            const tipoLabel = TIPOS_CUENTA.find((t) => t.value === c.tipo)?.label ?? c.tipo;

            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${c.color}20`, color: c.color }}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted">{tipoLabel}</p>
                </div>

                {ajustandoId === c.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={nuevoSaldo}
                      onChange={(e) => setNuevoSaldo(e.target.value)}
                      className="w-28 text-right text-sm"
                      autoFocus
                    />
                    <button onClick={() => confirmarAjuste(c.id)} className="text-accent hover:opacity-80" aria-label="Guardar saldo">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setAjustandoId(null)} className="text-muted hover:text-foreground" aria-label="Cancelar ajuste">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => empezarAjuste(c)}
                    className="shrink-0 text-sm font-semibold tabular-nums hover:underline"
                    title="Ajustar saldo manualmente"
                  >
                    {formatoMonto.format(c.saldo)}
                  </button>
                )}

                <button
                  onClick={() => setFormAbierto(c.id)}
                  className="shrink-0 text-muted hover:text-foreground"
                  aria-label="Editar cuenta"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(c.id)} className="shrink-0 text-muted hover:text-danger" aria-label="Eliminar cuenta">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <FormError message={error} />
      </div>
    </Card>
  );
}

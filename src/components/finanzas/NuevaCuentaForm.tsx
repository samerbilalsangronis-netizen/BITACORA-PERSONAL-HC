"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createCuenta, updateCuenta, type CuentaInput } from "@/lib/actions/cuentas";
import { ICONOS_DISPONIBLES, ICONO_MAP, COLORES_DISPONIBLES, TIPOS_CUENTA, TIPO_CUENTA_ICONO, TIPO_CUENTA_COLOR } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";
import type { Cuenta, TipoCuenta } from "@/lib/supabase/types";

export function NuevaCuentaForm({
  cuenta,
  onClose,
  onSaved,
}: {
  cuenta?: Cuenta;
  onClose: () => void;
  onSaved: (cuenta: Cuenta) => void;
}) {
  const esEdicion = Boolean(cuenta);
  const router = useRouter();
  const [nombre, setNombre] = useState(cuenta?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipo ?? "banco");
  const [saldoInicial, setSaldoInicial] = useState(cuenta?.saldo ?? 0);
  const [icono, setIcono] = useState(cuenta?.icono ?? TIPO_CUENTA_ICONO.banco);
  const [color, setColor] = useState(cuenta?.color ?? TIPO_CUENTA_COLOR.banco);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function cambiarTipo(t: TipoCuenta) {
    setTipo(t);
    if (!esEdicion) {
      setIcono(TIPO_CUENTA_ICONO[t]);
      setColor(TIPO_CUENTA_COLOR[t]);
    }
  }

  function submit() {
    setError(undefined);
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    startTransition(async () => {
      const result = esEdicion
        ? await updateCuenta(cuenta!.id, { nombre, tipo, icono, color })
        : await createCuenta({ nombre, tipo, saldo_inicial: Number(saldoInicial) || 0, icono, color } as CuentaInput);
      if (result.error || !result.data) {
        setError(result.error ?? "No se pudo guardar la cuenta.");
        return;
      }
      onSaved(result.data);
      router.refresh();
      onClose();
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{esEdicion ? "Editar cuenta" : "Nueva cuenta"}</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="cuenta-nombre">Nombre</Label>
          <Input
            id="cuenta-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Binance, Banesco, Efectivo…"
          />
        </div>

        <div>
          <Label htmlFor="cuenta-tipo">Tipo</Label>
          <Select id="cuenta-tipo" value={tipo} onChange={(e) => cambiarTipo(e.target.value as TipoCuenta)}>
            {TIPOS_CUENTA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        {!esEdicion && (
          <div>
            <Label htmlFor="cuenta-saldo">Saldo inicial</Label>
            <Input
              id="cuenta-saldo"
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
        )}

        <div>
          <Label>Ícono</Label>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {ICONOS_DISPONIBLES.map((ic) => {
              const Icon = ICONO_MAP[ic.key];
              return (
                <button
                  key={ic.key}
                  type="button"
                  title={ic.label}
                  onClick={() => setIcono(ic.key)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                    icono === ic.key ? "border-primary ring-2 ring-primary/30" : "border-border"
                  )}
                  style={{ color }}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORES_DISPONIBLES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  color === c ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending} loading={pending}>
            {esEdicion ? "Guardar cambios" : "Crear cuenta"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

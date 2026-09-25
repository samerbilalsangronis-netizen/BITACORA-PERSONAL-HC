"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { createTransaccion } from "@/lib/actions/finanzas";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import { TIPOS_TRANSACCION, categoriasPara } from "@/lib/constants";
import { cn, labelize, todayISO } from "@/lib/utils";
import type { TipoTransaccion } from "@/lib/supabase/types";

const initialState: ActionState = {};

export function NuevaTransaccionForm() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoTransaccion>("egreso");
  const [state, formAction, pending] = useActionState(createTransaccion, initialState);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        Nueva transacción
      </Button>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Nueva transacción</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          {TIPOS_TRANSACCION.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex-1 cursor-pointer rounded-md py-1.5 text-center font-medium transition-colors",
                tipo === t.value ? "bg-surface border border-border text-foreground" : "text-muted"
              )}
            >
              <input
                type="radio"
                name="tipo"
                value={t.value}
                checked={tipo === t.value}
                onChange={() => setTipo(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="monto">Monto</Label>
            <Input id="monto" name="monto" type="number" min={0} step="0.01" required placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" defaultValue={todayISO()} required />
          </div>
        </div>

        <div>
          <Label htmlFor="categoria">Categoría</Label>
          <Select id="categoria" name="categoria" defaultValue={categoriasPara(tipo)[0]} key={tipo}>
            {categoriasPara(tipo).map((c) => (
              <option key={c} value={c}>
                {labelize(c)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <Textarea id="descripcion" name="descripcion" rows={2} placeholder="Detalle de la transacción…" />
        </div>

        <FormError message={state.error} />
        <FormSuccess message={state.success} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { createMeta } from "@/lib/actions/metas";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import { TIPOS_META } from "@/lib/constants";
import { todayISO } from "@/lib/utils";

const initialState: ActionState = {};

export function NuevaMetaForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMeta, initialState);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        Nueva meta
      </Button>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Nueva meta</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
      <form
        action={(formData) => {
          formAction(formData);
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" required placeholder="Ej: Dominar análisis fundamental de renta fija" />
        </div>
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" rows={3} placeholder="Detalles, criterios de éxito…" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="tipo">Plazo</Label>
            <Select id="tipo" name="tipo" defaultValue="corto_plazo">
              {TIPOS_META.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fecha_inicio">Fecha inicio</Label>
            <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={todayISO()} />
          </div>
          <div>
            <Label htmlFor="fecha_objetivo">Fecha objetivo</Label>
            <Input id="fecha_objetivo" name="fecha_objetivo" type="date" />
          </div>
        </div>
        <FormError message={state.error} />
        <FormSuccess message={state.success} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Crear meta"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

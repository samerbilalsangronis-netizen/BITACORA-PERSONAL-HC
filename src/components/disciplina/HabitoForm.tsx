"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createHabito, updateHabito, type HabitoInput } from "@/lib/actions/disciplina";
import { ICONOS_DISPONIBLES, ICONO_MAP, COLORES_DISPONIBLES } from "@/lib/constants";
import { DIAS_SEMANA, TODOS_LOS_DIAS } from "@/lib/habitos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";
import type { CategoriaHabito, Habito, TipoHabito } from "@/lib/supabase/types";

export function HabitoForm({
  habito,
  categoriaDefault = "tarea",
  onClose,
}: {
  habito?: Habito;
  categoriaDefault?: CategoriaHabito;
  onClose: () => void;
}) {
  const [categoria, setCategoria] = useState<CategoriaHabito>(habito?.categoria ?? categoriaDefault);
  const [tipo, setTipo] = useState<TipoHabito>(habito?.tipo ?? "check");
  const [nombre, setNombre] = useState(habito?.nombre ?? "");
  const [objetivo, setObjetivo] = useState(habito?.objetivo ?? 1);
  const [unidad, setUnidad] = useState(habito?.unidad ?? "");
  const [icono, setIcono] = useState(habito?.icono ?? ICONOS_DISPONIBLES[0].key);
  const [color, setColor] = useState(habito?.color ?? COLORES_DISPONIBLES[0]);
  const [diasSemana, setDiasSemana] = useState<number[]>(habito?.dias_semana ?? TODOS_LOS_DIAS);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const router = useRouter();
  const esEdicion = Boolean(habito);

  function toggleDia(dia: number) {
    setDiasSemana((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()));
  }

  function submit() {
    setError(undefined);
    const input: HabitoInput = { categoria, tipo, nombre, objetivo, unidad, icono, color, dias_semana: diasSemana };
    startTransition(async () => {
      const result = esEdicion ? await updateHabito(habito!.id, input) : await createHabito(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{esEdicion ? "Editar" : "Nuevo"} {categoria === "tarea" ? "tarea" : "hábito"}</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          {(["tarea", "habito"] as CategoriaHabito[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={cn(
                "flex-1 rounded-md py-1.5 font-medium transition-colors",
                categoria === c ? "bg-surface border border-border text-foreground" : "text-muted"
              )}
            >
              {c === "tarea" ? "Tarea" : "Hábito"}
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="habito-nombre">Nombre</Label>
          <Input
            id="habito-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tomar agua, Levantarse 5am…"
          />
        </div>

        <div>
          <Label>Tipo</Label>
          <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
            {(["check", "contador"] as TipoHabito[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={cn(
                  "flex-1 rounded-md py-1.5 font-medium transition-colors",
                  tipo === t ? "bg-surface border border-border text-foreground" : "text-muted"
                )}
              >
                {t === "check" ? "Marcar cumplido" : "Contador con objetivo"}
              </button>
            ))}
          </div>
        </div>

        {tipo === "contador" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="habito-objetivo">Objetivo</Label>
              <Input
                id="habito-objetivo"
                type="number"
                min={1}
                value={objetivo}
                onChange={(e) => setObjetivo(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="habito-unidad">Unidad</Label>
              <Input
                id="habito-unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="vasos, pasos, min…"
              />
            </div>
          </div>
        )}

        <div>
          <Label>Días de la semana</Label>
          <div className="flex flex-wrap gap-1.5">
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.value}
                type="button"
                title={d.label}
                onClick={() => toggleDia(d.value)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  diasSemana.includes(d.value)
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:bg-surface-muted"
                )}
              >
                {d.corta}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-3 text-xs">
            <button type="button" onClick={() => setDiasSemana(TODOS_LOS_DIAS)} className="text-primary hover:underline">
              Todos los días
            </button>
            <button
              type="button"
              onClick={() => setDiasSemana([1, 2, 3, 4, 5])}
              className="text-primary hover:underline"
            >
              Entre semana
            </button>
          </div>
        </div>

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
            {esEdicion ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  generarObjetivosConIA,
  guardarObjetivosGenerados,
  type ObjetivoGuardarInput,
} from "@/lib/actions/metaObjetivos";
import { TIPO_OBJETIVO_LABEL, PERIODO_LABEL } from "@/lib/metasProgreso";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import type { MetaObjetivo, PeriodoObjetivo, TipoObjetivo } from "@/lib/supabase/types";

let nextLocalId = 0;

interface Fila extends ObjetivoGuardarInput {
  localId: number;
  justificacion?: string;
}

function toFila(o: Omit<ObjetivoGuardarInput, "origen"> & { origen?: ObjetivoGuardarInput["origen"]; justificacion?: string }): Fila {
  return { ...o, origen: o.origen ?? "usuario", localId: nextLocalId++ };
}

export function GenerarObjetivosPanel({
  metaId,
  teniaObjetivos,
  onClose,
  onSaved,
}: {
  metaId: string;
  teniaObjetivos: boolean;
  onClose: () => void;
  onSaved: (objetivos: MetaObjetivo[]) => void;
}) {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "revisar" | "guardando">("inicial");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function generar() {
    setEstado("cargando");
    setError(undefined);
    startTransition(async () => {
      const result = await generarObjetivosConIA(metaId);
      if (result.error || !result.objetivos) {
        setError(result.error ?? "No se pudieron generar objetivos.");
        setEstado("revisar");
        setFilas([]);
        return;
      }
      setFilas(result.objetivos.map((o) => toFila({ ...o, origen: "agente" })));
      setEstado("revisar");
    });
  }

  function actualizarFila(localId: number, patch: Partial<Fila>) {
    setFilas((prev) => prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f)));
  }

  function eliminarFila(localId: number) {
    setFilas((prev) => prev.filter((f) => f.localId !== localId));
  }

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      toFila({ nombre: "", tipo: "hito", cantidad_objetivo: 1, periodo: null, unidad: "", peso: 1, origen: "usuario" }),
    ]);
  }

  function cambiarTipo(localId: number, tipo: TipoObjetivo) {
    actualizarFila(localId, {
      tipo,
      periodo: tipo === "frecuencia" ? "semana" : null,
      cantidad_objetivo: tipo === "hito" ? 1 : 1,
    });
  }

  function guardar() {
    setError(undefined);
    if (filas.length === 0) {
      setError("Agrega al menos un objetivo.");
      return;
    }
    setEstado("guardando");
    startTransition(async () => {
      const payload: ObjetivoGuardarInput[] = filas.map((f) => ({
        nombre: f.nombre,
        tipo: f.tipo,
        cantidad_objetivo: f.cantidad_objetivo,
        periodo: f.periodo,
        unidad: f.unidad,
        peso: f.peso,
        origen: f.origen,
      }));
      const result = await guardarObjetivosGenerados(metaId, payload);
      if (result.error || !result.data) {
        setError(result.error ?? "No se pudieron guardar los objetivos.");
        setEstado("revisar");
        return;
      }
      onSaved(result.data);
      onClose();
    });
  }

  return (
    <Card className="border-primary/30">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={15} className="text-primary" /> Objetivos sugeridos por IA
        </h4>
        <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      {estado === "inicial" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Claude analizará el título y la descripción de esta meta y propondrá objetivos medibles que luego puedes editar.
          </p>
          <Button type="button" size="sm" onClick={generar}>
            <Sparkles size={14} /> Generar objetivos
          </Button>
        </div>
      )}

      {estado === "cargando" && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" /> Analizando la meta…
        </div>
      )}

      {(estado === "revisar" || estado === "guardando") && (
        <div className="space-y-3">
          {teniaObjetivos && (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              Guardar aquí reemplazará los objetivos actuales de esta meta.
            </p>
          )}

          {filas.map((f) => (
            <div key={f.localId} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <Input
                  value={f.nombre}
                  onChange={(e) => actualizarFila(f.localId, { nombre: e.target.value })}
                  placeholder="Nombre del objetivo"
                  className="flex-1"
                />
                <button
                  onClick={() => eliminarFila(f.localId)}
                  className="mt-1 shrink-0 text-muted hover:text-danger"
                  aria-label="Quitar objetivo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {f.justificacion && <p className="text-xs italic text-muted">{f.justificacion}</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={f.tipo}
                    onChange={(e) => cambiarTipo(f.localId, e.target.value as TipoObjetivo)}
                    className="text-xs"
                  >
                    {(Object.keys(TIPO_OBJETIVO_LABEL) as TipoObjetivo[]).map((t) => (
                      <option key={t} value={t}>
                        {TIPO_OBJETIVO_LABEL[t]}
                      </option>
                    ))}
                  </Select>
                </div>
                {f.tipo === "frecuencia" && (
                  <div>
                    <Label className="text-xs">Período</Label>
                    <Select
                      value={f.periodo ?? "semana"}
                      onChange={(e) => actualizarFila(f.localId, { periodo: e.target.value as PeriodoObjetivo })}
                      className="text-xs"
                    >
                      {(Object.keys(PERIODO_LABEL) as PeriodoObjetivo[]).map((p) => (
                        <option key={p} value={p}>
                          por {PERIODO_LABEL[p]}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={f.cantidad_objetivo}
                    disabled={f.tipo === "hito"}
                    onChange={(e) => actualizarFila(f.localId, { cantidad_objetivo: Number(e.target.value) || 1 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidad</Label>
                  <Input
                    value={f.unidad}
                    onChange={(e) => actualizarFila(f.localId, { unidad: e.target.value })}
                    placeholder="veces, $, min…"
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="w-24">
                <Label className="text-xs">Peso</Label>
                <Input
                  type="number"
                  min={0.1}
                  step="any"
                  value={f.peso}
                  onChange={(e) => actualizarFila(f.localId, { peso: Number(e.target.value) || 1 })}
                  className="text-xs"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={agregarFila}>
            <Plus size={14} /> Agregar objetivo
          </Button>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={generar}>
              Regenerar con IA
            </Button>
            <Button type="button" size="sm" onClick={guardar} disabled={estado === "guardando"} loading={estado === "guardando"}>
              Guardar objetivos
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

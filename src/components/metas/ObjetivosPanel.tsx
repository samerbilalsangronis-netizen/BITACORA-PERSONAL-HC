"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  actualizarObjetivo,
  crearObjetivoManual,
  eliminarObjetivo,
  type ObjetivoGuardarInput,
} from "@/lib/actions/metaObjetivos";
import {
  calcularProgresoMeta,
  calcularProgresoObjetivo,
  indexarAvancesPorObjetivo,
  PERIODO_LABEL,
  TIPO_OBJETIVO_LABEL,
} from "@/lib/metasProgreso";
import { GenerarObjetivosPanel } from "@/components/metas/GenerarObjetivosPanel";
import { RegistrarAvancePanel } from "@/components/metas/RegistrarAvancePanel";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";
import type { Meta, MetaObjetivo, MetaObjetivoAvance, PeriodoObjetivo, TipoObjetivo } from "@/lib/supabase/types";

const FORM_VACIO: ObjetivoGuardarInput = {
  nombre: "",
  tipo: "hito",
  cantidad_objetivo: 1,
  periodo: null,
  unidad: "",
  peso: 1,
  origen: "usuario",
};

export function ObjetivosPanel({
  meta,
  objetivosIniciales,
  avances,
  today,
}: {
  meta: Meta;
  objetivosIniciales: MetaObjetivo[];
  avances: MetaObjetivoAvance[];
  today: string;
}) {
  const [objetivos, setObjetivos] = useState<MetaObjetivo[]>(objetivosIniciales);
  const [expandido, setExpandido] = useState(objetivosIniciales.length === 0);
  const [panel, setPanel] = useState<"ninguno" | "generar" | "registrar">("ninguno");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState<ObjetivoGuardarInput>(FORM_VACIO);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const avancesPorObjetivo = useMemo(() => indexarAvancesPorObjetivo(avances), [avances]);

  const porcentaje = useMemo(
    () => calcularProgresoMeta(objetivos, avancesPorObjetivo, meta.fecha_inicio, today),
    [objetivos, avancesPorObjetivo, meta.fecha_inicio, today]
  );

  function cerrarFormManual() {
    setAgregando(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
    setError(undefined);
  }

  function empezarEdicion(o: MetaObjetivo) {
    setAgregando(false);
    setEditandoId(o.id);
    setForm({
      nombre: o.nombre,
      tipo: o.tipo,
      cantidad_objetivo: o.cantidad_objetivo,
      periodo: o.periodo,
      unidad: o.unidad,
      peso: o.peso,
      origen: o.origen,
    });
  }

  function guardarManual() {
    setError(undefined);
    startTransition(async () => {
      if (editandoId) {
        const result = await actualizarObjetivo(editandoId, form);
        if (result.error) {
          setError(result.error);
          return;
        }
        setObjetivos((prev) => prev.map((o) => (o.id === editandoId ? { ...o, ...form } : o)));
      } else {
        const result = await crearObjetivoManual(meta.id, form);
        if (result.error || !result.data) {
          setError(result.error ?? "No se pudo crear el objetivo.");
          return;
        }
        setObjetivos((prev) => [...prev, result.data!]);
      }
      cerrarFormManual();
      router.refresh();
    });
  }

  function onEliminar(objetivoId: string) {
    if (!confirm("¿Eliminar este objetivo?")) return;
    startTransition(async () => {
      const result = await eliminarObjetivo(objetivoId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setObjetivos((prev) => prev.filter((o) => o.id !== objetivoId));
      router.refresh();
    });
  }

  function cambiarTipoForm(tipo: TipoObjetivo) {
    setForm((f) => ({ ...f, tipo, periodo: tipo === "frecuencia" ? (f.periodo ?? "semana") : null, cantidad_objetivo: tipo === "hito" ? 1 : f.cantidad_objetivo }));
  }

  return (
    <div className={cn("mt-4 space-y-3", isPending && "opacity-80")}>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn("h-full rounded-full transition-all", porcentaje >= 100 ? "bg-accent" : "bg-primary")}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <span className="w-10 text-right text-sm font-semibold tabular-nums">{porcentaje}%</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpandido((s) => !s)}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
        >
          Objetivos ({objetivos.length})
          {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setPanel(panel === "generar" ? "ninguno" : "generar")}>
            <Sparkles size={13} /> Generar con IA
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setPanel(panel === "registrar" ? "ninguno" : "registrar")}>
            Registrar avance
          </Button>
        </div>
      </div>

      {expandido && (
        <div className="space-y-2">
          {objetivos.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
              Esta meta no tiene objetivos todavía. Genera objetivos con IA o agrega uno manualmente.
            </p>
          )}

          {objetivos.map((o) => {
            const { logrado, esperado, porcentaje: pObjetivo } = calcularProgresoObjetivo(
              o,
              avancesPorObjetivo.get(o.id) ?? [],
              meta.fecha_inicio,
              today
            );

            if (editandoId === o.id) {
              return (
                <ObjetivoForm
                  key={o.id}
                  form={form}
                  setForm={setForm}
                  onTipoChange={cambiarTipoForm}
                  onCancel={cerrarFormManual}
                  onSubmit={guardarManual}
                  pending={isPending}
                  error={error}
                  esEdicion
                />
              );
            }

            return (
              <div key={o.id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.nombre}</p>
                    <p className="text-xs text-muted">
                      {TIPO_OBJETIVO_LABEL[o.tipo]}
                      {o.periodo ? ` · por ${PERIODO_LABEL[o.periodo]}` : ""} · {logrado}/{esperado} {o.unidad}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">{pObjetivo}%</span>
                  <button onClick={() => empezarEdicion(o)} className="shrink-0 text-muted hover:text-foreground" aria-label="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onEliminar(o.id)} className="shrink-0 text-muted hover:text-danger" aria-label="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${pObjetivo}%` }} />
                </div>
              </div>
            );
          })}

          {agregando ? (
            <ObjetivoForm
              form={form}
              setForm={setForm}
              onTipoChange={cambiarTipoForm}
              onCancel={cerrarFormManual}
              onSubmit={guardarManual}
              pending={isPending}
              error={error}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAgregando(true);
                setForm(FORM_VACIO);
              }}
            >
              <Plus size={14} /> Agregar objetivo
            </Button>
          )}
        </div>
      )}

      {panel === "generar" && (
        <GenerarObjetivosPanel
          metaId={meta.id}
          teniaObjetivos={objetivos.length > 0}
          onClose={() => setPanel("ninguno")}
          onSaved={(nuevos) => {
            setObjetivos(nuevos);
            setExpandido(true);
            router.refresh();
          }}
        />
      )}

      {panel === "registrar" && (
        <RegistrarAvancePanel
          metaId={meta.id}
          objetivos={objetivos}
          onClose={() => setPanel("ninguno")}
          onAplicado={() => router.refresh()}
        />
      )}
    </div>
  );
}

function ObjetivoForm({
  form,
  setForm,
  onTipoChange,
  onCancel,
  onSubmit,
  pending,
  error,
  esEdicion,
}: {
  form: ObjetivoGuardarInput;
  setForm: React.Dispatch<React.SetStateAction<ObjetivoGuardarInput>>;
  onTipoChange: (tipo: TipoObjetivo) => void;
  onCancel: () => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  esEdicion?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 p-3">
      <div className="flex items-start gap-2">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          placeholder="Nombre del objetivo"
          className="flex-1"
        />
        <button onClick={onCancel} className="mt-1 shrink-0 text-muted hover:text-foreground" aria-label="Cancelar">
          <X size={15} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={form.tipo} onChange={(e) => onTipoChange(e.target.value as TipoObjetivo)} className="text-xs">
            {(Object.keys(TIPO_OBJETIVO_LABEL) as TipoObjetivo[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_OBJETIVO_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
        {form.tipo === "frecuencia" && (
          <div>
            <Label className="text-xs">Período</Label>
            <Select
              value={form.periodo ?? "semana"}
              onChange={(e) => setForm((f) => ({ ...f, periodo: e.target.value as PeriodoObjetivo }))}
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
            value={form.cantidad_objetivo}
            disabled={form.tipo === "hito"}
            onChange={(e) => setForm((f) => ({ ...f, cantidad_objetivo: Number(e.target.value) || 1 }))}
            className="text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Unidad</Label>
          <Input
            value={form.unidad}
            onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
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
          value={form.peso}
          onChange={(e) => setForm((f) => ({ ...f, peso: Number(e.target.value) || 1 }))}
          className="text-xs"
        />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={onSubmit} disabled={pending} loading={pending}>
          {esEdicion ? "Guardar cambios" : "Crear"}
        </Button>
      </div>
    </div>
  );
}

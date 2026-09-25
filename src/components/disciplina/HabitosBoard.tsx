"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { deleteHabito, registrarValor, updateHabito } from "@/lib/actions/disciplina";
import { computeHabitoStreak, estaCreadoPara, estaProgramado, indexarRegistros } from "@/lib/habitos";
import { HabitoRow } from "@/components/disciplina/HabitoRow";
import { HabitoForm } from "@/components/disciplina/HabitoForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, daysAgoISO, formatDate } from "@/lib/utils";
import type { CategoriaHabito, Habito, HabitoRegistro } from "@/lib/supabase/types";

function Seccion({
  titulo,
  categoria,
  habitos,
  fecha,
  today,
  valorPorFecha,
  pendingIds,
  mostrarPausados,
  onChange,
  onToggleActivo,
  onDelete,
  onCrear,
  onEditar,
}: {
  titulo: string;
  categoria: CategoriaHabito;
  habitos: Habito[];
  fecha: string;
  today: string;
  valorPorFecha: Map<string, number>;
  pendingIds: Set<string>;
  mostrarPausados: boolean;
  onChange: (habitoId: string, valor: number) => void;
  onToggleActivo: (habito: Habito) => void;
  onDelete: (habito: Habito) => void;
  onCrear: () => void;
  onEditar: (habito: Habito) => void;
}) {
  const delDia = habitos.filter(
    (h) => h.categoria === categoria && (mostrarPausados || h.activo) && estaCreadoPara(h, fecha) && estaProgramado(h, fecha)
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          {titulo} ({delDia.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={onCrear}>
          <Plus size={14} />
          Nuevo
        </Button>
      </div>

      {delDia.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Nada programado para hoy en esta categoría.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {delDia.map((h) => {
            const valor = valorPorFecha.get(`${h.id}|${fecha}`) ?? 0;
            const streak = computeHabitoStreak(h, valorPorFecha, today);
            return (
              <HabitoRow
                key={h.id}
                habito={h}
                valor={valor}
                streak={streak}
                pending={pendingIds.has(h.id)}
                onChange={(v) => onChange(h.id, v)}
                onEdit={() => onEditar(h)}
                onToggleActivo={() => onToggleActivo(h)}
                onDelete={() => onDelete(h)}
              />
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function HabitosBoard({
  habitos,
  registros,
  fecha,
  today,
}: {
  habitos: Habito[];
  registros: HabitoRegistro[];
  fecha: string;
  today: string;
}) {
  const [valorPorFecha, setValorPorFecha] = useState(() => indexarRegistros(registros));
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [mostrarPausados, setMostrarPausados] = useState(false);
  const [formAbierto, setFormAbierto] = useState<{ categoria: CategoriaHabito; habito?: Habito } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const isToday = fecha === today;
  const isFuture = fecha > today;

  const hayPausados = useMemo(() => habitos.some((h) => !h.activo), [habitos]);

  function marcarPendiente(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function onChange(habitoId: string, valor: number) {
    setValorPorFecha((prev) => new Map(prev).set(`${habitoId}|${fecha}`, valor));
    marcarPendiente(habitoId, true);
    startTransition(async () => {
      await registrarValor(habitoId, fecha, valor);
      marcarPendiente(habitoId, false);
      router.refresh();
    });
  }

  function onToggleActivo(habito: Habito) {
    startTransition(async () => {
      await updateHabito(habito.id, { activo: !habito.activo });
      router.refresh();
    });
  }

  function onDelete(habito: Habito) {
    if (!confirm(`¿Eliminar "${habito.nombre}" y todo su historial?`)) return;
    startTransition(async () => {
      await deleteHabito(habito.id);
      router.refresh();
    });
  }

  function goTo(newFecha: string) {
    router.push(`/disciplina?fecha=${newFecha}`);
  }

  const delDiaTodas = habitos.filter((h) => h.activo && estaCreadoPara(h, fecha) && estaProgramado(h, fecha));
  const completadasHoy = delDiaTodas.filter((h) => (valorPorFecha.get(`${h.id}|${fecha}`) ?? 0) >= h.objetivo).length;
  const porcentaje = delDiaTodas.length === 0 ? 0 : Math.round((completadasHoy / delDiaTodas.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(daysAgoISO(1, fecha))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-muted"
              aria-label="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-40 text-center">
              <p className="text-sm font-semibold">{formatDate(fecha)}</p>
              {isToday && <p className="text-xs text-primary">Hoy</p>}
            </div>
            <button
              onClick={() => goTo(daysAgoISO(-1, fecha))}
              disabled={isFuture}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-muted disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <Button variant="secondary" size="sm" onClick={() => goTo(today)}>
                Ir a hoy
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={cn("h-full rounded-full", porcentaje === 100 ? "bg-accent" : "bg-primary")}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums">{porcentaje}%</span>
          </div>
        </div>
      </Card>

      {formAbierto && (
        <HabitoForm
          habito={formAbierto.habito}
          categoriaDefault={formAbierto.categoria}
          onClose={() => setFormAbierto(null)}
        />
      )}

      <Seccion
        titulo="Tareas"
        categoria="tarea"
        habitos={habitos}
        fecha={fecha}
        today={today}
        valorPorFecha={valorPorFecha}
        pendingIds={pendingIds}
        mostrarPausados={mostrarPausados}
        onChange={onChange}
        onToggleActivo={onToggleActivo}
        onDelete={onDelete}
        onCrear={() => setFormAbierto({ categoria: "tarea" })}
        onEditar={(h) => setFormAbierto({ categoria: h.categoria, habito: h })}
      />

      <Seccion
        titulo="Hábitos"
        categoria="habito"
        habitos={habitos}
        fecha={fecha}
        today={today}
        valorPorFecha={valorPorFecha}
        pendingIds={pendingIds}
        mostrarPausados={mostrarPausados}
        onChange={onChange}
        onToggleActivo={onToggleActivo}
        onDelete={onDelete}
        onCrear={() => setFormAbierto({ categoria: "habito" })}
        onEditar={(h) => setFormAbierto({ categoria: h.categoria, habito: h })}
      />

      {hayPausados && (
        <button
          type="button"
          onClick={() => setMostrarPausados((s) => !s)}
          className="text-xs text-muted hover:text-foreground hover:underline"
        >
          {mostrarPausados ? "Ocultar pausados" : "Mostrar pausados"}
        </button>
      )}
    </div>
  );
}

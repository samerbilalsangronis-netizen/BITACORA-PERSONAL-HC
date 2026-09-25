"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from "lucide-react";
import { saveDailyTasks } from "@/lib/actions/disciplina";
import type { TareaDiaria } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn, formatDate, todayISO, daysAgoISO } from "@/lib/utils";

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function DisciplinaBoard({ fecha, initialTareas }: { fecha: string; initialTareas: TareaDiaria[] }) {
  const [tareas, setTareas] = useState<TareaDiaria[]>(
    [...initialTareas].sort((a, b) => a.orden - b.orden)
  );
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isToday = fecha === todayISO();
  const isFuture = fecha > todayISO();

  function persist(next: TareaDiaria[]) {
    setTareas(next);
    startTransition(async () => {
      await saveDailyTasks(fecha, next);
      // revalidatePath no siempre invalida el router cache del cliente cuando
      // la acción se llama directo (sin <form>) — forzamos refresh para que
      // volver por el nav no muestre una versión vieja de la página.
      router.refresh();
    });
  }

  function addTarea() {
    const descripcion = nuevaTarea.trim();
    if (!descripcion) return;
    const nueva: TareaDiaria = {
      id: crypto.randomUUID(),
      descripcion,
      orden: tareas.length,
      completada: false,
      hora_completada: null,
    };
    persist([...tareas, nueva]);
    setNuevaTarea("");
  }

  function toggleTarea(id: string) {
    const next = tareas.map((t) =>
      t.id === id
        ? { ...t, completada: !t.completada, hora_completada: !t.completada ? new Date().toISOString() : null }
        : t
    );
    persist(next);
  }

  function deleteTarea(id: string) {
    const next = tareas.filter((t) => t.id !== id).map((t, i) => ({ ...t, orden: i }));
    persist(next);
  }

  function updateDescripcion(id: string, descripcion: string) {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, descripcion } : t)));
  }

  function commitDescripcion() {
    persist(tareas);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= tareas.length) return;
    const reordered = moveItem(tareas, index, target).map((t, i) => ({ ...t, orden: i }));
    persist(reordered);
  }

  const total = tareas.length;
  const completadas = tareas.filter((t) => t.completada).length;
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  function goTo(newFecha: string) {
    router.push(`/disciplina?fecha=${newFecha}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(daysAgoISO(dayDiff(fecha) + 1))}
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
              onClick={() => goTo(daysAgoISO(dayDiff(fecha) - 1))}
              disabled={isFuture}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-muted disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <Button variant="secondary" size="sm" onClick={() => goTo(todayISO())}>
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

      <Card>
        <div className="mb-4 flex gap-2">
          <Input
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTarea()}
            placeholder="Ej: Levantarse 5am, Aseo personal, Estudio análisis…"
          />
          <Button onClick={addTarea} disabled={isPending}>
            <Plus size={16} />
            Agregar
          </Button>
        </div>

        {tareas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Todavía no tienes tareas para este día. Agrega la primera arriba.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tareas.map((tarea, index) => (
              <li key={tarea.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggleTarea(tarea.id)}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                    tarea.completada
                      ? "border-accent bg-accent text-white"
                      : "border-border text-transparent hover:border-primary"
                  )}
                  aria-label="Marcar completada"
                >
                  <Check size={14} />
                </button>
                <input
                  value={tarea.descripcion}
                  onChange={(e) => updateDescripcion(tarea.id, e.target.value)}
                  onBlur={commitDescripcion}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className={cn(
                    "flex-1 bg-transparent text-sm focus:outline-none",
                    tarea.completada && "text-muted line-through"
                  )}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted disabled:opacity-20"
                    aria-label="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === tareas.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted disabled:opacity-20"
                    aria-label="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteTarea(tarea.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label="Eliminar tarea"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function dayDiff(fecha: string): number {
  const ms = new Date(`${todayISO()}T00:00:00`).getTime() - new Date(`${fecha}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

"use client";

import { useState } from "react";
import { Check, Flame, Minus, Pause, Play, Plus, Settings2, Trash2 } from "lucide-react";
import { ICONO_MAP } from "@/lib/constants";
import { estaCumplido } from "@/lib/habitos";
import { cn } from "@/lib/utils";
import type { Habito } from "@/lib/supabase/types";

export function HabitoRow({
  habito,
  valor,
  streak,
  pending,
  onChange,
  onEdit,
  onToggleActivo,
  onDelete,
}: {
  habito: Habito;
  valor: number;
  streak: number;
  pending: boolean;
  onChange: (valor: number) => void;
  onEdit: () => void;
  onToggleActivo: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const Icon = ICONO_MAP[habito.icono] ?? ICONO_MAP.otro;
  const cumplido = estaCumplido(habito, valor);

  return (
    <li className={cn("relative flex items-center gap-3 py-3", pending && "opacity-60")}>
      {habito.tipo === "check" ? (
        <button
          onClick={() => onChange(cumplido ? 0 : 1)}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            cumplido ? "border-transparent text-white" : "text-transparent hover:opacity-70"
          )}
          style={{
            background: cumplido ? habito.color : `${habito.color}15`,
            borderColor: cumplido ? "transparent" : habito.color,
          }}
          aria-label="Marcar cumplido"
        >
          {cumplido ? <Check size={18} /> : <Icon size={16} style={{ color: habito.color }} />}
        </button>
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${habito.color}15`, color: habito.color }}
        >
          <Icon size={16} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <button onClick={() => setShowActions((s) => !s)} className="flex items-center gap-1.5 text-left">
          <p className={cn("truncate text-sm font-medium", cumplido && habito.tipo === "check" && "text-muted line-through")}>
            {habito.nombre}
          </p>
        </button>
        {habito.tipo === "contador" && (
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (valor / habito.objetivo) * 100)}%`, background: habito.color }}
              />
            </div>
            <span className="text-xs text-muted tabular-nums">
              {valor}/{habito.objetivo} {habito.unidad}
            </span>
          </div>
        )}
      </div>

      {streak > 0 && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
          <Flame size={12} />
          {streak}
        </span>
      )}

      {habito.tipo === "contador" && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onChange(Math.max(0, valor - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-muted"
            aria-label="Restar"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => onChange(valor + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-muted"
            aria-label="Sumar"
          >
            <Plus size={13} />
          </button>
        </div>
      )}

      <button
        onClick={() => setShowActions((s) => !s)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-muted"
        aria-label="Más acciones"
      >
        <Settings2 size={14} />
      </button>

      {showActions && (
        <div className="absolute right-0 top-full z-10 mt-1 flex gap-1 rounded-lg border border-border bg-surface p-1 shadow-md">
          <button
            onClick={() => {
              setShowActions(false);
              onEdit();
            }}
            className="rounded-md px-2 py-1 text-xs text-foreground hover:bg-surface-muted"
          >
            Editar
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              onToggleActivo();
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground hover:bg-surface-muted"
          >
            {habito.activo ? <Pause size={12} /> : <Play size={12} />}
            {habito.activo ? "Pausar" : "Reanudar"}
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              onDelete();
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10"
          >
            <Trash2 size={12} />
            Eliminar
          </button>
        </div>
      )}
    </li>
  );
}

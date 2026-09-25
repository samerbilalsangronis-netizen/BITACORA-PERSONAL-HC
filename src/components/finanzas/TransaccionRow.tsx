"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTransaccion } from "@/lib/actions/finanzas";
import { resolveCategoriaVisual } from "@/lib/constants";
import type { CategoriaPersonalizada, Transaccion } from "@/lib/supabase/types";
import { formatDate, labelize, cn } from "@/lib/utils";

const formatoMonto = new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" });

export function TransaccionRow({
  transaccion,
  categoriasPersonalizadas = [],
  index = 0,
}: {
  transaccion: Transaccion;
  categoriasPersonalizadas?: CategoriaPersonalizada[];
  index?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const esIngreso = transaccion.tipo === "ingreso";
  const { Icon, color } = resolveCategoriaVisual(transaccion.categoria, categoriasPersonalizadas);

  function onDelete() {
    if (!confirm("¿Eliminar esta transacción?")) return;
    startTransition(async () => {
      await deleteTransaccion(transaccion.id);
      router.refresh();
    });
  }

  return (
    <li
      className={cn("flex items-center gap-3 py-3 animate-fade-in-up", isPending && "opacity-50")}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${color}20`, color }}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {labelize(transaccion.categoria)}
          {transaccion.descripcion && <span className="font-normal text-muted"> · {transaccion.descripcion}</span>}
        </p>
        <p className="text-xs text-muted">{formatDate(transaccion.fecha)}</p>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", esIngreso ? "text-accent" : "text-danger")}>
        {esIngreso ? "+" : "-"}
        {formatoMonto.format(transaccion.monto)}
      </span>
      <button
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
        aria-label="Eliminar transacción"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { Meta, MetaObjetivo, MetaObjetivoAvance, MetaProgresoHistorial, EstadoMeta } from "@/lib/supabase/types";
import { updateEstado, deleteMeta } from "@/lib/actions/metas";
import { createClient } from "@/lib/supabase/client";
import { ObjetivosPanel } from "@/components/metas/ObjetivosPanel";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn, formatDate, formatDateTime, labelize } from "@/lib/utils";
import { ESTADOS_META, TIPOS_META } from "@/lib/constants";

const estadoTone: Record<EstadoMeta, "success" | "primary" | "warning"> = {
  completada: "success",
  activa: "primary",
  pausada: "warning",
};

export function MetaCard({
  meta,
  objetivos,
  avances,
  today,
}: {
  meta: Meta;
  objetivos: MetaObjetivo[];
  avances: MetaObjetivoAvance[];
  today: string;
}) {
  const [estado, setEstado] = useState(meta.estado);
  const [historial, setHistorial] = useState<MetaProgresoHistorial[] | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeEstado(value: EstadoMeta) {
    setEstado(value);
    startTransition(async () => {
      await updateEstado(meta.id, value);
      router.refresh();
    });
  }

  async function toggleHistorial() {
    if (!showHistorial && historial === null) {
      const supabase = createClient();
      const { data } = await supabase
        .from("meta_progreso_historial")
        .select("*")
        .eq("meta_id", meta.id)
        .order("created_at", { ascending: false });
      setHistorial(data ?? []);
    }
    setShowHistorial((s) => !s);
  }

  function onDelete() {
    if (!confirm("¿Eliminar esta meta y su historial de progreso?")) return;
    startTransition(async () => {
      await deleteMeta(meta.id);
      router.refresh();
    });
  }

  const tipoLabel = TIPOS_META.find((t) => t.value === meta.tipo)?.label ?? labelize(meta.tipo);

  return (
    <Card className={cn(isPending && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{meta.titulo}</h3>
            <Badge tone="default">{tipoLabel}</Badge>
            <Badge tone={estadoTone[estado]}>{ESTADOS_META.find((e) => e.value === estado)?.label}</Badge>
          </div>
          {meta.descripcion && <p className="text-sm text-muted">{meta.descripcion}</p>}
          <p className="mt-1 text-xs text-muted">
            {formatDate(meta.fecha_inicio)}
            {meta.fecha_objetivo ? ` → ${formatDate(meta.fecha_objetivo)}` : ""}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
          aria-label="Eliminar meta"
        >
          <X size={16} />
        </button>
      </div>

      <ObjetivosPanel meta={meta} objetivosIniciales={objetivos} avances={avances} today={today} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={estado}
          onChange={(e) => changeEstado(e.target.value as EstadoMeta)}
          className="w-auto"
        >
          {ESTADOS_META.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="sm" onClick={toggleHistorial}>
          Historial de progreso
          {showHistorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>

      {showHistorial && (
        <div className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
          {historial === null && <p className="text-xs text-muted">Cargando…</p>}
          {historial?.length === 0 && <p className="text-xs text-muted">Sin cambios registrados aún.</p>}
          {historial?.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-xs text-muted">
              <span>{formatDateTime(h.created_at)}</span>
              <span className="font-semibold text-foreground">{h.progreso}%</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

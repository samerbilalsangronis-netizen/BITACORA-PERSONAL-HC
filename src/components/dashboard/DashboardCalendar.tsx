"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { ICONO_MAP } from "@/lib/constants";
import { estaCreadoPara, estaCumplido, estaProgramado, indexarRegistros } from "@/lib/habitos";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn, formatDate } from "@/lib/utils";
import type { Habito, HabitoRegistro } from "@/lib/supabase/types";

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

type MetaDelDia = { id: string; titulo: string; fecha_objetivo: string };

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DashboardCalendar({
  habitos,
  registros,
  metas,
  today,
}: {
  habitos: Habito[];
  registros: HabitoRegistro[];
  metas: MetaDelDia[];
  today: string;
}) {
  const [mes, setMes] = useState(today.slice(0, 7)); // "YYYY-MM"
  const [seleccionado, setSeleccionado] = useState(today);

  const valorPorFecha = useMemo(() => indexarRegistros(registros), [registros]);
  const metasPorFecha = useMemo(() => {
    const map = new Map<string, MetaDelDia[]>();
    for (const m of metas) {
      const arr = map.get(m.fecha_objetivo) ?? [];
      arr.push(m);
      map.set(m.fecha_objetivo, arr);
    }
    return map;
  }, [metas]);

  const activos = useMemo(() => habitos.filter((h) => h.activo), [habitos]);

  const celdas = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const primerDia = new Date(Date.UTC(y, m - 1, 1));
    const dow = (primerDia.getUTCDay() + 6) % 7; // lunes = 0
    const inicio = new Date(primerDia);
    inicio.setUTCDate(inicio.getUTCDate() - dow);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setUTCDate(d.getUTCDate() + i);
      const fecha = toISO(d);
      return { fecha, delMes: fecha.slice(0, 7) === mes };
    });
  }, [mes]);

  function cambiarMes(delta: number) {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMes(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  const habitosDelSeleccionado = activos.filter((h) => estaCreadoPara(h, seleccionado) && estaProgramado(h, seleccionado));
  const metasDelSeleccionado = metasPorFecha.get(seleccionado) ?? [];
  const esFuturo = seleccionado > today;

  const nombreMes = capitalize(
    new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(`${mes}-01T00:00:00`))
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>Calendario</CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => cambiarMes(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted" aria-label="Mes anterior">
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-28 text-center font-medium">{nombreMes}</span>
          <button onClick={() => cambiarMes(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted" aria-label="Mes siguiente">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {DIAS_CORTOS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map(({ fecha, delMes }) => {
          const tieneHabitos = activos.some((h) => estaCreadoPara(h, fecha) && estaProgramado(h, fecha));
          const tieneMetas = metasPorFecha.has(fecha);
          const esHoy = fecha === today;
          const esSeleccionado = fecha === seleccionado;
          return (
            <button
              key={fecha}
              onClick={() => setSeleccionado(fecha)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors",
                !delMes && "text-muted/40",
                delMes && !esSeleccionado && "text-foreground hover:bg-surface-muted",
                esSeleccionado && "bg-primary text-primary-foreground font-semibold",
                esHoy && !esSeleccionado && "border border-primary text-primary font-semibold"
              )}
            >
              {Number(fecha.slice(8, 10))}
              <span className="mt-0.5 flex gap-0.5">
                {tieneHabitos && (
                  <span className={cn("h-1 w-1 rounded-full", esSeleccionado ? "bg-primary-foreground" : "bg-primary")} />
                )}
                {tieneMetas && (
                  <span className={cn("h-1 w-1 rounded-full", esSeleccionado ? "bg-primary-foreground" : "bg-accent")} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-semibold">{formatDate(seleccionado)}</p>

        {habitosDelSeleccionado.length === 0 && metasDelSeleccionado.length === 0 ? (
          <p className="text-sm text-muted">Nada programado este día.</p>
        ) : (
          <div className="space-y-3">
            {habitosDelSeleccionado.length > 0 && (
              <ul className="space-y-1.5">
                {habitosDelSeleccionado.map((h) => {
                  const Icon = ICONO_MAP[h.icono] ?? ICONO_MAP.otro;
                  const valor = valorPorFecha.get(`${h.id}|${seleccionado}`) ?? 0;
                  const cumplido = estaCumplido(h, valor);
                  return (
                    <li key={h.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${h.color}20`, color: h.color }}
                      >
                        <Icon size={12} />
                      </span>
                      <span className={cn("flex-1 truncate", !esFuturo && cumplido && "text-muted line-through")}>{h.nombre}</span>
                      {!esFuturo && (
                        <span className={cn("text-xs font-medium", cumplido ? "text-accent" : "text-muted")}>
                          {cumplido ? "Cumplido" : "Pendiente"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {metasDelSeleccionado.length > 0 && (
              <ul className="space-y-1.5">
                {metasDelSeleccionado.map((m) => (
                  <li key={m.id}>
                    <Link href="/metas" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Target size={14} className="shrink-0" />
                      <span className="truncate">{m.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

import { daysAgoISO } from "@/lib/utils";
import type { Habito, HabitoRegistro } from "@/lib/supabase/types";

// 0 = domingo … 6 = sábado (coincide con Date#getUTCDay).
export const DIAS_SEMANA: { value: number; corta: string; label: string }[] = [
  { value: 1, corta: "L", label: "Lunes" },
  { value: 2, corta: "M", label: "Martes" },
  { value: 3, corta: "X", label: "Miércoles" },
  { value: 4, corta: "J", label: "Jueves" },
  { value: 5, corta: "V", label: "Viernes" },
  { value: 6, corta: "S", label: "Sábado" },
  { value: 0, corta: "D", label: "Domingo" },
];

export const TODOS_LOS_DIAS = [0, 1, 2, 3, 4, 5, 6];

export function diaSemana(fechaISO: string): number {
  return new Date(`${fechaISO}T00:00:00Z`).getUTCDay();
}

export function estaProgramado(habito: Pick<Habito, "dias_semana">, fechaISO: string): boolean {
  return habito.dias_semana.includes(diaSemana(fechaISO));
}

export function estaCreadoPara(habito: Pick<Habito, "created_at">, fechaISO: string): boolean {
  return habito.created_at.slice(0, 10) <= fechaISO;
}

export function estaCumplido(habito: Pick<Habito, "objetivo">, valor: number): boolean {
  return valor >= habito.objetivo;
}

/** Mapa "habitoId|fecha" -> valor, para búsquedas O(1) al calcular rachas/stats. */
export function indexarRegistros(registros: HabitoRegistro[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of registros) map.set(`${r.habito_id}|${r.fecha}`, r.valor);
  return map;
}

/**
 * Racha de días consecutivos (hacia atrás desde `today`) en los que el
 * hábito estaba programado y se cumplió el objetivo. Los días no
 * programados se saltan sin romper la racha, y si "hoy" todavía no se
 * cumplió no se rompe la racha (el día no ha terminado).
 */
export function computeHabitoStreak(
  habito: Pick<Habito, "dias_semana" | "objetivo" | "created_at">,
  valorPorFecha: Map<string, number>,
  today: string,
  maxDias = 400
): number {
  let streak = 0;
  for (let i = 0; i < maxDias; i++) {
    const fecha = daysAgoISO(i, today);
    if (!estaCreadoPara(habito, fecha)) break;
    if (!estaProgramado(habito, fecha)) continue;
    const valor = valorPorFecha.get(fecha) ?? 0;
    if (estaCumplido(habito, valor)) {
      streak++;
      continue;
    }
    if (fecha === today) continue;
    break;
  }
  return streak;
}

export type DiaStat = { fecha: string; tareas_totales: number; tareas_completadas: number; porcentaje_cumplimiento: number };

/**
 * Reduce hábitos + registros a un % de cumplimiento diario global (mismo
 * shape que usaban antes DisciplinaAreaChart/HeatmapCalendar/computeStreak,
 * para poder reusarlos sin tocarlos).
 */
export function computeStatsDiarios(habitos: Habito[], registros: HabitoRegistro[], fechas: string[]): DiaStat[] {
  const valorPorFecha = indexarRegistros(registros);
  const activos = habitos.filter((h) => h.activo);

  return fechas.map((fecha) => {
    const programados = activos.filter((h) => estaCreadoPara(h, fecha) && estaProgramado(h, fecha));
    const total = programados.length;
    const completadas = programados.filter((h) => estaCumplido(h, valorPorFecha.get(`${h.id}|${fecha}`) ?? 0)).length;
    const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 10000) / 100;
    return { fecha, tareas_totales: total, tareas_completadas: completadas, porcentaje_cumplimiento: porcentaje };
  });
}

import type { MetaObjetivo, MetaObjetivoAvance, PeriodoObjetivo, TipoObjetivo } from "@/lib/supabase/types";

function diasEntre(desdeISO: string, hastaISO: string): number {
  const a = new Date(`${desdeISO}T00:00:00Z`).getTime();
  const b = new Date(`${hastaISO}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function periodosTranscurridos(periodo: PeriodoObjetivo, dias: number): number {
  if (periodo === "dia") return dias + 1;
  if (periodo === "semana") return Math.floor(dias / 7) + 1;
  return Math.floor(dias / 30) + 1;
}

export function indexarAvancesPorObjetivo(avances: MetaObjetivoAvance[]): Map<string, MetaObjetivoAvance[]> {
  const map = new Map<string, MetaObjetivoAvance[]>();
  for (const a of avances) {
    const arr = map.get(a.objetivo_id) ?? [];
    arr.push(a);
    map.set(a.objetivo_id, arr);
  }
  return map;
}

/**
 * % de un objetivo. "hito" y "acumulado" son logrado/objetivo directo;
 * "frecuencia" compara lo logrado contra lo esperado a lo largo de los
 * períodos ya transcurridos desde que empezó la meta (ej. objetivo "1
 * post/día", 5 días transcurridos -> esperado 5; publicaste 4 -> 80%).
 */
export function calcularProgresoObjetivo(
  objetivo: Pick<MetaObjetivo, "tipo" | "cantidad_objetivo" | "periodo">,
  avances: Pick<MetaObjetivoAvance, "cantidad">[],
  fechaInicio: string,
  today: string
): { logrado: number; esperado: number; porcentaje: number } {
  const logrado = avances.reduce((s, a) => s + a.cantidad, 0);
  let esperado = objetivo.cantidad_objetivo;

  if (objetivo.tipo === "frecuencia" && objetivo.periodo) {
    const dias = diasEntre(fechaInicio, today);
    const periodos = periodosTranscurridos(objetivo.periodo, dias);
    esperado = objetivo.cantidad_objetivo * periodos;
  }

  const porcentaje = esperado <= 0 ? 0 : Math.min(100, Math.round((logrado / esperado) * 100));
  return { logrado: Math.round(logrado * 100) / 100, esperado: Math.round(esperado * 100) / 100, porcentaje };
}

/** % global de la meta: promedio ponderado (por `peso`) del % de cada objetivo. */
export function calcularProgresoMeta(
  objetivos: MetaObjetivo[],
  avancesPorObjetivo: Map<string, MetaObjetivoAvance[]>,
  fechaInicio: string,
  today: string
): number {
  if (objetivos.length === 0) return 0;
  const pesoTotal = objetivos.reduce((s, o) => s + o.peso, 0);
  if (pesoTotal <= 0) return 0;

  const suma = objetivos.reduce((s, o) => {
    const { porcentaje } = calcularProgresoObjetivo(o, avancesPorObjetivo.get(o.id) ?? [], fechaInicio, today);
    return s + porcentaje * o.peso;
  }, 0);

  return Math.round(suma / pesoTotal);
}

export const PERIODO_LABEL: Record<PeriodoObjetivo, string> = {
  dia: "día",
  semana: "semana",
  mes: "mes",
};

export const TIPO_OBJETIVO_LABEL: Record<TipoObjetivo, string> = {
  frecuencia: "Frecuencia (recurrente)",
  hito: "Hito (paso único)",
  acumulado: "Acumulado (hacia un total)",
};

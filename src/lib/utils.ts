import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function labelize(value: string): string {
  return value
    .split(/[_-]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function computeStreak(
  stats: { fecha: string; porcentaje_cumplimiento: number }[],
  today?: string
): number {
  const byFecha = new Map(stats.map((s) => [s.fecha, s.porcentaje_cumplimiento]));
  let streak = 0;
  for (let i = 0; ; i++) {
    const fecha = daysAgoISO(i, today);
    if ((byFecha.get(fecha) ?? 0) >= 100) streak++;
    else break;
  }
  return streak;
}

/**
 * `days` antes de hoy. Sin `from`, usa el reloj local del entorno que corre
 * esto (correcto en el navegador; en el servidor es UTC — para cálculos de
 * servidor anclados al día real del usuario, pasa `from` con el resultado
 * de `todayISOForUser()`).
 */
export function daysAgoISO(days: number, from?: string): string {
  if (from) {
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  }
  const d = new Date();
  d.setDate(d.getDate() - days);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

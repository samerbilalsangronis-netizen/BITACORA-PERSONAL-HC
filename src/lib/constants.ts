import type { Tipo, TipoMeta, EstadoMeta, TipoTransaccion } from "@/lib/supabase/types";

export const EMOCIONES = [
  "ansiedad",
  "confianza",
  "frustracion",
  "euforia",
  "miedo",
  "calma",
  "impaciencia",
  "duda",
  "orgullo",
  "alivio",
  "codicia",
  "arrepentimiento",
] as const;

export const EMOCION_COLORES: Record<string, string> = {
  ansiedad: "#f59e0b",
  confianza: "#22c55e",
  frustracion: "#ef4444",
  euforia: "#a855f7",
  miedo: "#64748b",
  calma: "#38bdf8",
  impaciencia: "#fb923c",
  duda: "#eab308",
  orgullo: "#14b8a6",
  alivio: "#84cc16",
  codicia: "#e11d48",
  arrepentimiento: "#8b5cf6",
};

export const TIPOS_JOURNAL: { value: Tipo; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "post-operacion", label: "Post-operación" },
  { value: "reflexion", label: "Reflexión" },
];

export const TIPOS_META: { value: TipoMeta; label: string }[] = [
  { value: "corto_plazo", label: "Corto plazo" },
  { value: "mediano_plazo", label: "Mediano plazo" },
  { value: "largo_plazo", label: "Largo plazo" },
];

export const ESTADOS_META: { value: EstadoMeta; label: string }[] = [
  { value: "activa", label: "Activa" },
  { value: "completada", label: "Completada" },
  { value: "pausada", label: "Pausada" },
];

export const TIPOS_TRANSACCION: { value: TipoTransaccion; label: string }[] = [
  { value: "ingreso", label: "Ingreso" },
  { value: "egreso", label: "Egreso" },
];

export const CATEGORIAS_INGRESO = [
  "salario",
  "trading",
  "freelance",
  "inversiones",
  "regalo",
  "otro",
] as const;

export const CATEGORIAS_EGRESO = [
  "vivienda",
  "comida",
  "transporte",
  "suscripciones",
  "entretenimiento",
  "salud",
  "educacion",
  "trading_gastos",
  "ahorro_inversion",
  "otro",
] as const;

export function categoriasPara(tipo: TipoTransaccion): readonly string[] {
  return tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
}

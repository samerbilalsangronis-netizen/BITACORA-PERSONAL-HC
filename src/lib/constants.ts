import {
  Home,
  Utensils,
  Bus,
  Car,
  Plane,
  CreditCard,
  Cigarette,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  LineChart,
  PiggyBank,
  Gift,
  Wallet,
  Smartphone,
  Dumbbell,
  Coffee,
  Film,
  Wrench,
  Music,
  PawPrint,
  CircleHelp,
  Banknote,
  TrendingUp,
  Laptop,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import type { Tipo, TipoMeta, EstadoMeta, TipoTransaccion, CategoriaPersonalizada } from "@/lib/supabase/types";

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

// Set curado de íconos seleccionables al crear una categoría personalizada.
// La clave (`key`) es lo que se guarda en `categorias_personalizadas.icono`.
export const ICONO_MAP: Record<string, LucideIcon> = {
  casa: Home,
  comida: Utensils,
  bus: Bus,
  auto: Car,
  avion: Plane,
  tarjeta: CreditCard,
  cigarro: Cigarette,
  carrito: ShoppingCart,
  salud: HeartPulse,
  estudio: GraduationCap,
  grafico: LineChart,
  alcancia: PiggyBank,
  regalo: Gift,
  billetera: Wallet,
  telefono: Smartphone,
  pesas: Dumbbell,
  cafe: Coffee,
  pelicula: Film,
  herramienta: Wrench,
  musica: Music,
  mascota: PawPrint,
  billetes: Banknote,
  tendencia: TrendingUp,
  laptop: Laptop,
  repetir: Repeat,
  otro: CircleHelp,
};

export const ICONOS_DISPONIBLES: { key: string; label: string }[] = [
  { key: "casa", label: "Casa" },
  { key: "comida", label: "Comida" },
  { key: "bus", label: "Transporte" },
  { key: "auto", label: "Auto" },
  { key: "avion", label: "Viajes" },
  { key: "tarjeta", label: "Tarjeta" },
  { key: "cigarro", label: "Vicios" },
  { key: "carrito", label: "Compras" },
  { key: "salud", label: "Salud" },
  { key: "estudio", label: "Estudio" },
  { key: "grafico", label: "Trading" },
  { key: "alcancia", label: "Ahorro" },
  { key: "regalo", label: "Regalo" },
  { key: "billetera", label: "Ingreso" },
  { key: "telefono", label: "Servicios" },
  { key: "pesas", label: "Gimnasio" },
  { key: "cafe", label: "Café" },
  { key: "pelicula", label: "Ocio" },
  { key: "herramienta", label: "Mantenimiento" },
  { key: "musica", label: "Música" },
  { key: "mascota", label: "Mascotas" },
  { key: "otro", label: "Otro" },
];

export function iconoFor(key: string): LucideIcon {
  return ICONO_MAP[key] ?? ICONO_MAP.otro;
}

// Ícono y color por defecto de cada categoría fija (no personalizada).
export const CATEGORIA_ICONO_KEY: Record<string, string> = {
  salario: "billetera",
  trading: "tendencia",
  freelance: "laptop",
  inversiones: "alcancia",
  regalo: "regalo",
  vivienda: "casa",
  comida: "comida",
  transporte: "bus",
  suscripciones: "repetir",
  entretenimiento: "pelicula",
  salud: "salud",
  educacion: "estudio",
  trading_gastos: "grafico",
  ahorro_inversion: "billetes",
  otro: "otro",
};

export const CATEGORIA_COLOR: Record<string, string> = {
  salario: "#1baf7a",
  trading: "#2a78d6",
  freelance: "#eda100",
  inversiones: "#4a3aa7",
  regalo: "#e87ba4",
  vivienda: "#eb6834",
  comida: "#e34948",
  transporte: "#2a78d6",
  suscripciones: "#4a3aa7",
  entretenimiento: "#e87ba4",
  salud: "#1baf7a",
  educacion: "#eda100",
  trading_gastos: "#008300",
  ahorro_inversion: "#0075de",
  otro: "#898781",
};

export const COLORES_DISPONIBLES = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#0075de",
  "#898781",
];

/** Ícono + color a mostrar para una transacción, sea categoría fija o personalizada. */
export function resolveCategoriaVisual(
  categoria: string,
  personalizadas: CategoriaPersonalizada[]
): { Icon: LucideIcon; color: string } {
  const custom = personalizadas.find((c) => c.nombre.toLowerCase() === categoria.toLowerCase());
  if (custom) return { Icon: iconoFor(custom.icono), color: custom.color };
  return {
    Icon: iconoFor(CATEGORIA_ICONO_KEY[categoria] ?? "otro"),
    color: CATEGORIA_COLOR[categoria] ?? CATEGORIA_COLOR.otro,
  };
}

// Paleta validada (ver skill dataviz) para gráficos: categórica de 8 tonos,
// estado (bueno/alerta/crítico) y secuencial azul para magnitudes continuas.

export const CATEGORICAL: Record<"light" | "dark", string[]> = {
  light: [
    "#2a78d6", // blue
    "#eb6834", // orange
    "#1baf7a", // aqua
    "#eda100", // yellow
    "#e87ba4", // magenta
    "#008300", // green
    "#4a3aa7", // violet
    "#e34948", // red
  ],
  dark: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
    "#e66767",
  ],
};

export const CATEGORICAL_OTHER: Record<"light" | "dark", string> = {
  light: "#898781",
  dark: "#6b6a66",
};

export const STATUS: Record<"light" | "dark", { good: string; warning: string; serious: string; critical: string }> = {
  light: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
  dark: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
};

export const SEQUENTIAL_BLUE: Record<"light" | "dark", string> = {
  light: "#2a78d6",
  dark: "#3987e5",
};

export const CHART_CHROME: Record<"light" | "dark", { grid: string; axis: string; ink: string; muted: string }> = {
  light: { grid: "#e1e0d9", axis: "#c3c2b7", ink: "#0b0b0b", muted: "#898781" },
  dark: { grid: "#2c2c2a", axis: "#383835", ink: "#ffffff", muted: "#898781" },
};

export function heatmapColor(pct: number, mode: "light" | "dark"): string {
  const s = STATUS[mode];
  if (pct <= 0) return mode === "dark" ? "#182238" : "#eef1f8";
  if (pct < 50) return s.critical;
  if (pct < 100) return s.warning;
  return s.good;
}

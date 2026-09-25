import { cn } from "@/lib/utils";

const COLORS = ["#0075de", "#15803d", "#e32d14", "#ffb110", "#7c3aed", "#0d9488"];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function Avatar({
  nombre,
  avatarUrl,
  size = "md",
  className,
}: {
  nombre: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar viene de Supabase Storage (dominio dinámico por proyecto)
      <img
        src={avatarUrl}
        alt={nombre || "Avatar"}
        className={cn("shrink-0 rounded-full border border-border object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{ background: colorFor(nombre || "?") }}
    >
      {initialsFor(nombre || "?")}
    </div>
  );
}

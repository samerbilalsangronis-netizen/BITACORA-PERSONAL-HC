import Image from "next/image";
import { cn } from "@/lib/utils";

// Ícono (toro/oso) recortado del logo de Hikman Capital, sin fondo ni texto.
// Dos versiones para poder invertir el color según el tema sin JS: negro
// para el tema claro, blanco para el oscuro (ver public/brand/).
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/logo-mark-black.png"
        alt="TraderMind"
        width={481}
        height={359}
        priority
        className={cn("h-9 w-auto object-contain dark:hidden", className)}
      />
      <Image
        src="/brand/logo-mark-white.png"
        alt="TraderMind"
        width={481}
        height={359}
        priority
        className={cn("hidden h-9 w-auto object-contain dark:block", className)}
      />
    </>
  );
}

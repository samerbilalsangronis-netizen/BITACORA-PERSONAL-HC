import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="TraderMind"
      width={1024}
      height={559}
      priority
      className={cn("h-9 w-auto rounded-md object-contain", className)}
    />
  );
}

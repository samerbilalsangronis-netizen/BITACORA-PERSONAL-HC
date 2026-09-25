import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 17.5 L9.5 12 L13 14.5 L20 5.5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="5.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className
      )}
    >
      <LogoMark className="h-[18px] w-[18px]" />
    </div>
  );
}

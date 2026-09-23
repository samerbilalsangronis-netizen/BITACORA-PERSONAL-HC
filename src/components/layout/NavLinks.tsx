"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Target, NotebookPen, Wallet, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/disciplina", label: "Disciplina", icon: ListChecks },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/perfil", label: "Perfil", icon: User },
];

const HIKMAN_CAPITAL_URL = "https://hikman-prueba.vercel.app/";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <div className="my-2 border-t border-border" />
      <a
        href={HIKMAN_CAPITAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        title="Abre Hikman Capital (análisis macro) en una pestaña nueva"
      >
        <TrendingUp size={18} />
        Hikman Capital
      </a>
    </nav>
  );
}

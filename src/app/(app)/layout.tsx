import Link from "next/link";
import { requireUser } from "@/lib/session";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { ReminderScheduler } from "@/components/layout/ReminderScheduler";
import { PageTransition } from "@/components/layout/PageTransition";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <ReminderScheduler
        reminderEnabled={profile?.reminder_enabled ?? true}
        reminderTime={profile?.reminder_time ?? "08:00"}
      />
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-1">
          <Logo />
          <span className="text-sm font-semibold">TraderMind</span>
        </Link>
        <div className="flex-1">
          <NavLinks />
        </div>
        <Link
          href="/perfil"
          className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted"
        >
          <Avatar nombre={profile?.nombre ?? ""} avatarUrl={profile?.avatar_url} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.nombre || "Mi perfil"}</p>
            <p className="truncate text-xs text-muted">Ver perfil</p>
          </div>
        </Link>
        <SignOutButton />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <Logo className="h-8 w-auto" />
              <span className="text-sm font-medium text-muted">TraderMind</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle initialTheme={profile?.theme} />
            <Link href="/perfil" aria-label="Ver perfil" className="transition-transform duration-150 active:scale-95">
              <Avatar nombre={profile?.nombre ?? ""} avatarUrl={profile?.avatar_url} size="sm" />
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

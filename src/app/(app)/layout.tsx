import Link from "next/link";
import { requireUser } from "@/lib/session";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { ReminderScheduler } from "@/components/layout/ReminderScheduler";

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            TM
          </div>
          <span className="text-sm font-semibold">TraderMind</span>
        </Link>
        <div className="flex-1">
          <NavLinks />
        </div>
        <SignOutButton />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="text-sm font-medium text-muted md:hidden">TraderMind</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle initialTheme={profile?.theme} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

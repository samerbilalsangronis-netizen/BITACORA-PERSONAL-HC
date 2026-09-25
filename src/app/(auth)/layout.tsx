export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            TM
          </div>
          <h1 className="text-lg font-semibold text-foreground">TraderMind</h1>
          <p className="text-sm text-muted">Bitácora privada de disciplina y psicología de trading</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">{children}</div>
      </div>
    </div>
  );
}

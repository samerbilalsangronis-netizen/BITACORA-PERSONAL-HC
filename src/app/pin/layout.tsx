import { PageTransition } from "@/components/layout/PageTransition";

export default function PinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            TM
          </div>
          <h1 className="text-lg font-semibold text-foreground">Verificación de PIN</h1>
          <p className="text-sm text-muted">Segunda capa de seguridad de tu bitácora</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}

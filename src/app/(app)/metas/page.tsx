import { requireUser } from "@/lib/session";
import { NuevaMetaForm } from "@/components/metas/NuevaMetaForm";
import { MetaCard } from "@/components/metas/MetaCard";
import type { Meta } from "@/lib/supabase/types";

export default async function MetasPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("metas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const metas = (data ?? []) as Meta[];
  const activas = metas.filter((m) => m.estado === "activa");
  const pausadas = metas.filter((m) => m.estado === "pausada");
  const completadas = metas.filter((m) => m.estado === "completada");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Metas</h1>
          <p className="text-sm text-muted">Corto, mediano y largo plazo. Actualiza tu progreso a medida que avanzas.</p>
        </div>
        <NuevaMetaForm />
      </div>

      {metas.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Aún no tienes metas. Crea la primera con el botón &quot;Nueva meta&quot;.
        </p>
      )}

      {activas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Activas ({activas.length})</h2>
          <div className="space-y-3">
            {activas.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <MetaCard meta={m} />
              </div>
            ))}
          </div>
        </section>
      )}

      {pausadas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Pausadas ({pausadas.length})</h2>
          <div className="space-y-3">
            {pausadas.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <MetaCard meta={m} />
              </div>
            ))}
          </div>
        </section>
      )}

      {completadas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Completadas ({completadas.length})
          </h2>
          <div className="space-y-3">
            {completadas.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <MetaCard meta={m} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

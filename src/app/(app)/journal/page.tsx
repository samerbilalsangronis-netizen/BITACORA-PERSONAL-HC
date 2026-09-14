import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { EntryCard } from "@/components/journal/EntryCard";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { Button } from "@/components/ui/Button";
import type { JournalEntry, Tipo } from "@/lib/supabase/types";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; emocion?: string; fecha?: string }>;
}) {
  const { q, tipo, emocion, fecha } = await searchParams;
  const { supabase, user } = await requireUser();

  let query = supabase.from("journal_entries").select("*").eq("user_id", user.id);

  if (tipo) query = query.eq("tipo", tipo as Tipo);
  if (emocion) query = query.contains("emociones", [emocion]);
  if (fecha) query = query.gte("created_at", `${fecha}T00:00:00`).lte("created_at", `${fecha}T23:59:59`);
  if (q) {
    const safeQ = q.replace(/[,()]/g, " ").trim();
    if (safeQ) query = query.or(`titulo.ilike.%${safeQ}%,contenido.ilike.%${safeQ}%`);
  }

  const { data } = await query.order("created_at", { ascending: false });
  const entries = (data ?? []) as JournalEntry[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Journal / Bitácora</h1>
          <p className="text-sm text-muted">Tu historial personal de pensamientos y emociones.</p>
        </div>
        <Link href="/journal/nueva">
          <Button>
            <Plus size={16} />
            Nueva entrada
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <JournalFilters />
      </Suspense>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No hay entradas que coincidan con tu búsqueda.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

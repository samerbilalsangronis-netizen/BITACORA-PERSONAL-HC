import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { EntryForm } from "@/components/journal/EntryForm";
import { updateEntry } from "@/lib/actions/journal";
import { Card } from "@/components/ui/Card";

export default async function EditarEntradaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Editar entrada</h1>
      </div>
      <Card>
        <EntryForm action={updateEntry.bind(null, id)} entry={entry} submitLabel="Guardar cambios" />
      </Card>
    </div>
  );
}

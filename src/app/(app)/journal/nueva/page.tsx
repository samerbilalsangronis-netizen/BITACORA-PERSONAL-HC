import { EntryForm } from "@/components/journal/EntryForm";
import { createEntry } from "@/lib/actions/journal";
import { Card } from "@/components/ui/Card";

export default function NuevaEntradaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nueva entrada</h1>
        <p className="text-sm text-muted">Documenta tus pensamientos, emociones y aprendizajes.</p>
      </div>
      <Card>
        <EntryForm action={createEntry} submitLabel="Publicar entrada" />
      </Card>
    </div>
  );
}

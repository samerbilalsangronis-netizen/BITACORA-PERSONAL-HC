import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteEntryButton } from "@/components/journal/DeleteEntryButton";
import { formatDateTime, labelize } from "@/lib/utils";
import { TIPOS_JOURNAL } from "@/lib/constants";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  const tipoLabel = TIPOS_JOURNAL.find((t) => t.value === entry.tipo)?.label ?? labelize(entry.tipo);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/journal" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} />
        Volver al journal
      </Link>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{entry.titulo}</h1>
            <p className="mt-1 text-xs text-muted">{formatDateTime(entry.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/journal/${entry.id}/editar`}>
              <Button variant="secondary" size="sm">
                <Pencil size={14} />
                Editar
              </Button>
            </Link>
            <DeleteEntryButton id={entry.id} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="primary">{tipoLabel}</Badge>
          {entry.emociones.map((e: string) => (
            <Badge key={e}>{labelize(e)}</Badge>
          ))}
        </div>

        <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.contenido || "*Sin contenido.*"}</ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}

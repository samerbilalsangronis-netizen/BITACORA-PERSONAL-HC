import Link from "next/link";
import type { JournalEntry } from "@/lib/supabase/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, labelize } from "@/lib/utils";
import { TIPOS_JOURNAL } from "@/lib/constants";

export function EntryCard({ entry }: { entry: JournalEntry }) {
  const tipoLabel = TIPOS_JOURNAL.find((t) => t.value === entry.tipo)?.label ?? labelize(entry.tipo);
  const preview = entry.contenido.replace(/[#*_`>-]/g, "").slice(0, 160);

  return (
    <Link href={`/journal/${entry.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold">{entry.titulo}</h3>
          <Badge tone="primary">{tipoLabel}</Badge>
        </div>
        {preview && <p className="mt-1 line-clamp-2 text-sm text-muted">{preview}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">{formatDateTime(entry.created_at)}</span>
          {entry.emociones.slice(0, 4).map((e) => (
            <Badge key={e}>{labelize(e)}</Badge>
          ))}
          {entry.emociones.length > 4 && <Badge>+{entry.emociones.length - 4}</Badge>}
        </div>
      </Card>
    </Link>
  );
}

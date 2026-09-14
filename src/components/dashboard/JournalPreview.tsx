import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { JournalEntry } from "@/lib/supabase/types";
import { formatDateTime, labelize } from "@/lib/utils";

export function JournalPreview({ entry }: { entry: JournalEntry | null }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>Última entrada</CardTitle>
        <Link href="/journal/nueva">
          <Button size="sm">Nueva entrada</Button>
        </Link>
      </div>
      {entry ? (
        <Link href={`/journal/${entry.id}`} className="block">
          <p className="text-sm font-semibold">{entry.titulo}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {entry.contenido.replace(/[#*_`>-]/g, "").slice(0, 160) || "Sin contenido."}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{formatDateTime(entry.created_at)}</span>
            {entry.emociones.slice(0, 3).map((e) => (
              <Badge key={e}>{labelize(e)}</Badge>
            ))}
          </div>
        </Link>
      ) : (
        <p className="py-6 text-center text-sm text-muted">Aún no has escrito ninguna entrada.</p>
      )}
    </Card>
  );
}

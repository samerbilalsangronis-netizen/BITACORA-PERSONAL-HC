"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEntry } from "@/lib/actions/journal";
import { Button } from "@/components/ui/Button";

export function DeleteEntryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("¿Eliminar esta entrada permanentemente?")) return;
    startTransition(() => {
      deleteEntry(id);
    });
  }

  return (
    <Button variant="danger" size="sm" onClick={onDelete} disabled={pending} loading={pending}>
      <Trash2 size={14} />
      Eliminar
    </Button>
  );
}

"use client";

import { useActionState } from "react";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { EmocionSelector } from "@/components/journal/EmocionSelector";
import { MarkdownEditor } from "@/components/journal/MarkdownEditor";
import { TIPOS_JOURNAL } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";
import type { JournalEntry } from "@/lib/supabase/types";

const initialState: ActionState = {};

export function EntryForm({
  action,
  entry,
  submitLabel = "Guardar entrada",
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  entry?: JournalEntry;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required defaultValue={entry?.titulo} placeholder="Título de la entrada" />
      </div>

      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select id="tipo" name="tipo" defaultValue={entry?.tipo ?? "personal"} className="w-auto">
          {TIPOS_JOURNAL.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Emociones</Label>
        <EmocionSelector defaultValue={entry?.emociones} />
      </div>

      <div>
        <Label>Contenido</Label>
        <MarkdownEditor defaultValue={entry?.contenido} />
      </div>

      <FormError message={state.error} />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending} loading={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

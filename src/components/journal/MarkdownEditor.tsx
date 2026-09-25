"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/Input";

export function MarkdownEditor({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"escribir" | "vista">("escribir");

  return (
    <div>
      <div className="mb-2 flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {(["escribir", "vista"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 font-medium transition-colors",
              tab === t ? "bg-surface border border-border text-foreground" : "text-muted"
            )}
          >
            {t === "escribir" ? "Escribir" : "Vista previa"}
          </button>
        ))}
      </div>
      {tab === "escribir" ? (
        <Textarea
          name="contenido"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder="Escribe con formato Markdown: **negrita**, _cursiva_, listas, etc."
        />
      ) : (
        <div className="prose prose-sm max-w-none rounded-lg border border-border bg-surface px-4 py-3 text-foreground prose-headings:text-foreground prose-strong:text-foreground min-h-[18rem]">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted">Nada que previsualizar todavía.</p>
          )}
          <input type="hidden" name="contenido" value={value} />
        </div>
      )}
    </div>
  );
}

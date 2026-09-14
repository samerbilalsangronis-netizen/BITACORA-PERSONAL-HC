"use client";

import { useState } from "react";
import { cn, labelize } from "@/lib/utils";
import { EMOCIONES } from "@/lib/constants";

export function EmocionSelector({ defaultValue = [] }: { defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  function toggle(emocion: string) {
    setSelected((prev) => (prev.includes(emocion) ? prev.filter((e) => e !== emocion) : [...prev, emocion]));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EMOCIONES.map((emocion) => {
        const active = selected.includes(emocion);
        return (
          <button
            key={emocion}
            type="button"
            onClick={() => toggle(emocion)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted hover:bg-surface-muted"
            )}
          >
            {labelize(emocion)}
          </button>
        );
      })}
      {selected.map((emocion) => (
        <input key={emocion} type="hidden" name="emociones" value={emocion} />
      ))}
    </div>
  );
}

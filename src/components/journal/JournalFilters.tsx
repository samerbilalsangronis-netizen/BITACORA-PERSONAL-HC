"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { EMOCIONES, TIPOS_JOURNAL } from "@/lib/constants";
import { labelize } from "@/lib/utils";

export function JournalFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/journal?${params.toString()}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParam("q", q)}
          onBlur={() => updateParam("q", q)}
          placeholder="Buscar por palabra clave…"
          className="pl-9"
        />
      </div>
      <Select defaultValue={searchParams.get("tipo") ?? ""} onChange={(e) => updateParam("tipo", e.target.value)}>
        <option value="">Todos los tipos</option>
        {TIPOS_JOURNAL.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={searchParams.get("emocion") ?? ""}
        onChange={(e) => updateParam("emocion", e.target.value)}
      >
        <option value="">Todas las emociones</option>
        {EMOCIONES.map((e) => (
          <option key={e} value={e}>
            {labelize(e)}
          </option>
        ))}
      </Select>
      <Input
        type="date"
        defaultValue={searchParams.get("fecha") ?? ""}
        onChange={(e) => updateParam("fecha", e.target.value)}
      />
    </div>
  );
}

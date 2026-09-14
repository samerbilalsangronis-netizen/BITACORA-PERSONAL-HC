"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input, Select } from "@/components/ui/Input";
import { TIPOS_TRANSACCION, CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from "@/lib/constants";
import { labelize } from "@/lib/utils";

const TODAS_CATEGORIAS = Array.from(new Set([...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO])).sort();

export function FinanzasFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/finanzas?${params.toString()}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select defaultValue={searchParams.get("tipo") ?? ""} onChange={(e) => updateParam("tipo", e.target.value)}>
        <option value="">Ingresos y egresos</option>
        {TIPOS_TRANSACCION.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={searchParams.get("categoria") ?? ""}
        onChange={(e) => updateParam("categoria", e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {TODAS_CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {labelize(c)}
          </option>
        ))}
      </Select>
      <Input
        type="date"
        defaultValue={searchParams.get("desde") ?? ""}
        onChange={(e) => updateParam("desde", e.target.value)}
      />
      <Input
        type="date"
        defaultValue={searchParams.get("hasta") ?? ""}
        onChange={(e) => updateParam("hasta", e.target.value)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { HabitosBoard } from "@/components/disciplina/HabitosBoard";
import { HabitosInforme } from "@/components/disciplina/HabitosInforme";
import { cn } from "@/lib/utils";
import type { Habito, HabitoRegistro } from "@/lib/supabase/types";

type Tab = "hoy" | "informe";

export function DisciplinaTabs({
  habitos,
  registros,
  fecha,
  today,
}: {
  habitos: Habito[];
  registros: HabitoRegistro[];
  fecha: string;
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("hoy");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {([
          { value: "hoy", label: "Hoy" },
          { value: "informe", label: "Informe" },
        ] as { value: Tab; label: string }[]).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 rounded-md py-1.5 font-medium transition-colors",
              tab === t.value ? "bg-surface border border-border text-foreground" : "text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hoy" && <HabitosBoard habitos={habitos} registros={registros} fecha={fecha} today={today} />}
      {tab === "informe" && <HabitosInforme habitos={habitos} registros={registros} today={today} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { MetaCard } from "@/components/metas/MetaCard";
import { MetaLogradaCard } from "@/components/metas/MetaLogradaCard";
import { VisionBoard } from "@/components/metas/VisionBoard";
import { cn } from "@/lib/utils";
import type { Meta, VisionBoardItem } from "@/lib/supabase/types";

type Tab = "activas" | "logradas" | "vision";

export function MetasTabs({
  metas,
  visionItems,
  userId,
}: {
  metas: Meta[];
  visionItems: VisionBoardItem[];
  userId: string;
}) {
  const [tab, setTab] = useState<Tab>("activas");

  const activas = metas.filter((m) => m.estado === "activa");
  const pausadas = metas.filter((m) => m.estado === "pausada");
  const completadas = metas.filter((m) => m.estado === "completada");

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "activas", label: "Activas", count: activas.length + pausadas.length },
    { value: "logradas", label: "Logradas", count: completadas.length },
    { value: "vision", label: "Visión Board", count: visionItems.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-surface-muted p-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 rounded-md py-1.5 font-medium transition-colors",
              tab === t.value ? "bg-surface border border-border text-foreground" : "text-muted"
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "activas" &&
        (activas.length === 0 && pausadas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Aún no tienes metas activas. Crea la primera con el botón &quot;Nueva meta&quot;.
          </p>
        ) : (
          <div className="space-y-8">
            {activas.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Activas ({activas.length})</h2>
                <div className="space-y-3">
                  {activas.map((m, i) => (
                    <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <MetaCard meta={m} />
                    </div>
                  ))}
                </div>
              </section>
            )}
            {pausadas.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Pausadas ({pausadas.length})</h2>
                <div className="space-y-3">
                  {pausadas.map((m, i) => (
                    <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <MetaCard meta={m} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}

      {tab === "logradas" &&
        (completadas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Aún no tienes metas logradas. Cuando completes una al 100%, agrégale una foto para recordarla aquí.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completadas.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <MetaLogradaCard meta={m} userId={userId} />
              </div>
            ))}
          </div>
        ))}

      {tab === "vision" && <VisionBoard items={visionItems} userId={userId} />}
    </div>
  );
}

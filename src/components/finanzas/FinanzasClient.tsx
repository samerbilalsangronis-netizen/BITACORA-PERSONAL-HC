"use client";

import { useState } from "react";
import { FinanzasResumen } from "@/components/finanzas/FinanzasResumen";
import { NuevaTransaccionForm } from "@/components/finanzas/NuevaTransaccionForm";
import type { CategoriaPersonalizada, Transaccion } from "@/lib/supabase/types";

export function FinanzasClient({
  transacciones,
  categoriasPersonalizadas,
  today,
}: {
  transacciones: Transaccion[];
  categoriasPersonalizadas: CategoriaPersonalizada[];
  today: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <FinanzasResumen
        transacciones={transacciones}
        categoriasPersonalizadas={categoriasPersonalizadas}
        today={today}
        onAdd={() => setOpen(true)}
      />
      {open && (
        <NuevaTransaccionForm
          categoriasPersonalizadas={categoriasPersonalizadas}
          today={today}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

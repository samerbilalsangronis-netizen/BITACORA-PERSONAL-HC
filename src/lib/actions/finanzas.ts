"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/auth";
import type { TipoTransaccion } from "@/lib/supabase/types";

function parseMonto(raw: FormDataEntryValue | null): number | null {
  const monto = Number(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(monto) || monto < 0) return null;
  return Math.round(monto * 100) / 100;
}

export async function createTransaccion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const tipo = String(formData.get("tipo") || "egreso") as TipoTransaccion;
  const categoria = String(formData.get("categoria") || "otro");
  const descripcion = String(formData.get("descripcion") || "").trim();
  const fecha = String(formData.get("fecha") || "");
  const monto = parseMonto(formData.get("monto"));

  if (monto === null) return { error: "Ingresa un monto válido." };
  if (!fecha) return { error: "Selecciona una fecha." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("transacciones").insert({
    user_id: user.id,
    tipo,
    categoria,
    descripcion,
    fecha,
    monto,
  });

  if (error) return { error: "No se pudo registrar la transacción." };

  revalidatePath("/finanzas");
  revalidatePath("/dashboard");
  return { success: "Transacción registrada." };
}

export async function deleteTransaccion(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("transacciones").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: "No se pudo eliminar la transacción." };

  revalidatePath("/finanzas");
  revalidatePath("/dashboard");
  return { success: true };
}

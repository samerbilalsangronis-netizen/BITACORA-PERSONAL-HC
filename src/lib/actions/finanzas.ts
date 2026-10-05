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
  const cuentaId = String(formData.get("cuenta_id") || "") || null;

  if (monto === null) return { error: "Ingresa un monto válido." };
  if (!fecha) return { error: "Selecciona una fecha." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // La cuenta es obligatoria en cuanto el usuario tiene al menos una creada:
  // la idea es llevar un control claro de en qué cuenta está cada monto.
  const { data: cuentasUsuario } = await supabase.from("cuentas").select("id").eq("user_id", user.id).limit(1);
  if ((cuentasUsuario?.length ?? 0) > 0 && !cuentaId) {
    return { error: tipo === "ingreso" ? "Elige a qué cuenta entra este ingreso." : "Elige de qué cuenta sale este gasto." };
  }
  if (cuentaId) {
    const { data: cuentaValida } = await supabase
      .from("cuentas")
      .select("id")
      .eq("id", cuentaId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cuentaValida) return { error: "La cuenta seleccionada no es válida." };
  }

  const { error } = await supabase.from("transacciones").insert({
    user_id: user.id,
    tipo,
    categoria,
    descripcion,
    fecha,
    monto,
    cuenta_id: cuentaId,
  });

  if (error) return { error: error.message || "No se pudo registrar la transacción." };

  if (cuentaId && monto > 0) {
    const delta = tipo === "ingreso" ? monto : -monto;
    const { error: saldoError } = await supabase.rpc("ajustar_saldo_cuenta", {
      p_cuenta_id: cuentaId,
      p_delta: delta,
      p_user_id: user.id,
    });
    if (saldoError) return { error: `Transacción guardada, pero no se pudo actualizar el saldo: ${saldoError.message}` };
  }

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

  const { data: transaccion } = await supabase
    .from("transacciones")
    .select("tipo, monto, cuenta_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase.from("transacciones").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message || "No se pudo eliminar la transacción." };

  if (transaccion?.cuenta_id && transaccion.monto > 0) {
    const delta = transaccion.tipo === "ingreso" ? -transaccion.monto : transaccion.monto;
    await supabase.rpc("ajustar_saldo_cuenta", {
      p_cuenta_id: transaccion.cuenta_id,
      p_delta: delta,
      p_user_id: user.id,
    });
  }

  revalidatePath("/finanzas");
  revalidatePath("/dashboard");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Cuenta, TipoCuenta } from "@/lib/supabase/types";

export interface CuentaInput {
  nombre: string;
  tipo: TipoCuenta;
  saldo_inicial: number;
  icono: string;
  color: string;
}

function revalidar() {
  revalidatePath("/finanzas");
  revalidatePath("/dashboard");
}

export async function createCuenta(input: CuentaInput): Promise<{ error?: string; data?: Cuenta }> {
  const nombre = input.nombre.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!Number.isFinite(input.saldo_inicial)) return { error: "El saldo inicial no es válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: ultimo } = await supabase
    .from("cuentas")
    .select("orden")
    .eq("user_id", user.id)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("cuentas")
    .insert({
      user_id: user.id,
      nombre,
      tipo: input.tipo,
      saldo: input.saldo_inicial,
      icono: input.icono,
      color: input.color,
      orden: (ultimo?.orden ?? -1) + 1,
    })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear la cuenta." };

  revalidar();
  return { data: data as Cuenta };
}

export async function updateCuenta(
  id: string,
  input: Partial<Pick<CuentaInput, "nombre" | "tipo" | "icono" | "color">>
): Promise<{ error?: string; data?: Cuenta }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  if (typeof input.nombre === "string" && !input.nombre.trim()) return { error: "El nombre es obligatorio." };

  const patch: Partial<Cuenta> = { ...input };
  if (typeof input.nombre === "string") patch.nombre = input.nombre.trim();

  const { data, error } = await supabase
    .from("cuentas")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error || !data) return { error: error?.message ?? "No se pudo actualizar la cuenta." };

  revalidar();
  return { data: data as Cuenta };
}

/** Corrección manual del saldo (ej. configuración inicial, intereses, reconciliación). */
export async function ajustarSaldoCuenta(id: string, nuevoSaldo: number): Promise<{ error?: string }> {
  if (!Number.isFinite(nuevoSaldo)) return { error: "El saldo no es válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("cuentas").update({ saldo: nuevoSaldo }).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidar();
  return {};
}

export async function deleteCuenta(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("cuentas").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidar();
  return {};
}

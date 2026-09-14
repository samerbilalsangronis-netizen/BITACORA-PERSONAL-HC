"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PIN_COOKIE_NAME, computePinCookieValue, hashPin, verifyPinHash } from "@/lib/pin";
import type { ActionState } from "@/lib/actions/auth";

const PIN_REGEX = /^\d{4,6}$/;

async function setPinCookie(accessToken: string) {
  const cookieStore = await cookies();
  const value = await computePinCookieValue(accessToken);
  cookieStore.set(PIN_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function setupPin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const pin = String(formData.get("pin") || "");
  const pinConfirm = String(formData.get("pinConfirm") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!PIN_REGEX.test(pin)) {
    return { error: "El PIN debe tener entre 4 y 6 dígitos." };
  }
  if (pin !== pinConfirm) {
    return { error: "Los PIN no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pinHash = await hashPin(pin);
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash, pin_set: true })
    .eq("id", user.id);

  if (error) {
    return { error: "No se pudo guardar el PIN. Intenta de nuevo." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) await setPinCookie(session.access_token);

  redirect(next);
}

export async function verifyPin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const pin = String(formData.get("pin") || "");
  const next = String(formData.get("next") || "/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_hash, pin_set")
    .eq("id", user.id)
    .single();

  if (!profile?.pin_set || !profile.pin_hash) {
    redirect(`/pin/configurar?next=${encodeURIComponent(next)}`);
  }

  const valid = await verifyPinHash(pin, profile.pin_hash);
  if (!valid) {
    return { error: "PIN incorrecto." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) await setPinCookie(session.access_token);

  redirect(next);
}

export async function changePin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const pinActual = String(formData.get("pinActual") || "");
  const pinNuevo = String(formData.get("pinNuevo") || "");
  const pinNuevoConfirm = String(formData.get("pinNuevoConfirm") || "");

  if (!PIN_REGEX.test(pinNuevo)) {
    return { error: "El nuevo PIN debe tener entre 4 y 6 dígitos." };
  }
  if (pinNuevo !== pinNuevoConfirm) {
    return { error: "Los PIN nuevos no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", user.id)
    .single();

  if (profile?.pin_hash) {
    const valid = await verifyPinHash(pinActual, profile.pin_hash);
    if (!valid) return { error: "El PIN actual es incorrecto." };
  }

  const pinHash = await hashPin(pinNuevo);
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash, pin_set: true })
    .eq("id", user.id);

  if (error) return { error: "No se pudo actualizar el PIN." };

  return { success: "PIN actualizado correctamente." };
}

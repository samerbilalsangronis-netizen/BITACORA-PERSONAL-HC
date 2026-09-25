"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PIN_COOKIE_NAME } from "@/lib/pin";

export interface ActionState {
  error?: string;
  success?: string;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signIn(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(`/pin?next=${encodeURIComponent(next)}`);
}

export async function signUp(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const nombre = String(formData.get("nombre") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (!nombre || !email || !password) {
    return { error: "Completa todos los campos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message || "No se pudo crear la cuenta." };
  }

  if (!data.session) {
    return {
      success: "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
    };
  }

  redirect("/pin?next=/dashboard");
}

export async function forgotPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Ingresa tu correo." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  return {
    success: "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.",
  };
}

export async function resetPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "No se pudo actualizar la contraseña. Solicita un nuevo enlace." };
  }

  redirect("/login");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(PIN_COOKIE_NAME);
  revalidatePath("/", "layout");
  redirect("/login");
}

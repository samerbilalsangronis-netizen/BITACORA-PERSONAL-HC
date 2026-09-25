"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-base font-semibold">Recuperar contraseña</h2>
      <p className="text-sm text-muted">Te enviaremos un enlace a tu correo para restablecer tu contraseña.</p>
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" />
      </div>
      <FormError message={state.error} />
      <FormSuccess message={state.success} />
      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { resetPassword, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-base font-semibold">Nueva contraseña</h2>
      <div>
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <FormError message={state.error} />
      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </Button>
    </form>
  );
}

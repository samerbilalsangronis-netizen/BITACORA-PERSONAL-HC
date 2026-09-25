"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import { Card, CardTitle } from "@/components/ui/Card";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <Card>
      <CardTitle className="mb-4">Cambiar contraseña</CardTitle>
      <form action={formAction} className="space-y-4">
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
        <FormSuccess message={state.success} />
        <Button type="submit" disabled={pending} loading={pending}>
          {pending ? "Guardando…" : "Actualizar contraseña"}
        </Button>
      </form>
    </Card>
  );
}

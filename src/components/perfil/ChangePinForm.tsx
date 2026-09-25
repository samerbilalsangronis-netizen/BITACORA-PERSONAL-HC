"use client";

import { useActionState } from "react";
import { changePin } from "@/lib/actions/pin";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import { Card, CardTitle } from "@/components/ui/Card";

const initialState: ActionState = {};

export function ChangePinForm({ hasPinSet }: { hasPinSet: boolean }) {
  const [state, formAction, pending] = useActionState(changePin, initialState);

  return (
    <Card>
      <CardTitle className="mb-4">Cambiar PIN</CardTitle>
      <form action={formAction} className="space-y-4">
        {hasPinSet && (
          <div>
            <Label htmlFor="pinActual">PIN actual</Label>
            <Input
              id="pinActual"
              name="pinActual"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              required
            />
          </div>
        )}
        <div>
          <Label htmlFor="pinNuevo">Nuevo PIN</Label>
          <Input
            id="pinNuevo"
            name="pinNuevo"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={4}
            maxLength={6}
            required
          />
        </div>
        <div>
          <Label htmlFor="pinNuevoConfirm">Confirmar nuevo PIN</Label>
          <Input
            id="pinNuevoConfirm"
            name="pinNuevoConfirm"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={4}
            maxLength={6}
            required
          />
        </div>
        <FormError message={state.error} />
        <FormSuccess message={state.success} />
        <Button type="submit" disabled={pending} loading={pending}>
          {pending ? "Guardando…" : "Actualizar PIN"}
        </Button>
      </form>
    </Card>
  );
}

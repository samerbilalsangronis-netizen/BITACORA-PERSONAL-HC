"use client";

import { useActionState } from "react";
import { setupPin } from "@/lib/actions/pin";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";

const initialState: ActionState = {};

export function PinSetupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(setupPin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-foreground">
        Crea un PIN de 4 a 6 dígitos. Se te pedirá cada vez que inicies sesión, como segunda capa de seguridad.
      </p>
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="pin">Nuevo PIN</Label>
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          required
          placeholder="••••"
        />
      </div>
      <div>
        <Label htmlFor="pinConfirm">Confirmar PIN</Label>
        <Input
          id="pinConfirm"
          name="pinConfirm"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          required
          placeholder="••••"
        />
      </div>
      <FormError message={state.error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar PIN"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { verifyPin } from "@/lib/actions/pin";
import type { ActionState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";

const initialState: ActionState = {};

export function PinVerifyForm({ next, nombre }: { next: string; nombre: string }) {
  const [state, formAction, pending] = useActionState(verifyPin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-foreground">Hola {nombre || ""}, ingresa tu PIN para continuar.</p>
      <input type="hidden" name="next" value={next} />
      <Input
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        minLength={4}
        maxLength={6}
        required
        autoFocus
        placeholder="••••"
        className="text-center text-2xl tracking-[0.5em]"
      />
      <FormError message={state.error} />
      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {pending ? "Verificando…" : "Continuar"}
      </Button>
    </form>
  );
}

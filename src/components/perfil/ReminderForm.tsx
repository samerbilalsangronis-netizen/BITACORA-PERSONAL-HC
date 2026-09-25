"use client";

import { useActionState, useEffect, useState } from "react";
import { updateReminderSettings } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess } from "@/components/ui/FormMessage";
import { Card, CardTitle } from "@/components/ui/Card";
import { Bell, BellOff } from "lucide-react";

const initialState: ActionState = {};

export function ReminderForm({
  reminderEnabled,
  reminderTime,
}: {
  reminderEnabled: boolean;
  reminderTime: string;
}) {
  const [state, formAction, pending] = useActionState(updateReminderSettings, initialState);
  const [enabled, setEnabled] = useState(reminderEnabled);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lee el estado real del navegador, solo disponible en el cliente
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <Card>
      <CardTitle className="mb-4">Recordatorios</CardTitle>
      <form action={formAction} className="space-y-4">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="reminder_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--primary)]"
          />
          Activar recordatorio diario
        </label>
        <div>
          <Label htmlFor="reminder_time">Hora del recordatorio</Label>
          <Input
            id="reminder_time"
            name="reminder_time"
            type="time"
            defaultValue={reminderTime.slice(0, 5)}
            className="w-40"
            disabled={!enabled}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">
          {permission === "granted" ? <Bell size={14} /> : <BellOff size={14} />}
          {permission === "granted" && "Notificaciones del navegador activadas."}
          {permission === "denied" && "Bloqueaste las notificaciones del navegador para este sitio."}
          {permission === "default" && "Aún no activaste notificaciones del navegador."}
          {permission === "unsupported" && "Tu navegador no soporta notificaciones."}
          {(permission === "default" || permission === undefined) && (
            <button type="button" onClick={requestPermission} className="ml-auto text-primary hover:underline">
              Activar
            </button>
          )}
        </div>

        <FormError message={state.error} />
        <FormSuccess message={state.success} />
        <Button type="submit" disabled={pending} loading={pending}>
          {pending ? "Guardando…" : "Guardar recordatorio"}
        </Button>
      </form>
    </Card>
  );
}

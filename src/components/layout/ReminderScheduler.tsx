"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";

const REMINDER_MESSAGE = "No olvides registrar tu disciplina y tu bitácora de hoy.";

export function ReminderScheduler({
  reminderEnabled,
  reminderTime,
}: {
  reminderEnabled: boolean;
  reminderTime: string;
}) {
  useEffect(() => {
    if (!reminderEnabled) return;

    const [hh, mm] = reminderTime.split(":");
    const targetLabel = `${hh}:${mm}`;

    async function tick() {
      const now = new Date();
      const currentLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (currentLabel !== targetLabel) return;

      const storageKey = `tm-reminder-fired-${todayISO()}`;
      if (localStorage.getItem(storageKey)) return;
      localStorage.setItem(storageKey, "1");

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("TraderMind", { body: REMINDER_MESSAGE });
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("notificaciones").insert({
          user_id: user.id,
          titulo: "Recordatorio diario",
          mensaje: REMINDER_MESSAGE,
          tipo: "recordatorio",
        });
      }
    }

    const interval = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime]);

  return null;
}

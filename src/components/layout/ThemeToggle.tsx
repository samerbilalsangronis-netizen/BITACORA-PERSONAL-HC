"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import type { Theme } from "@/lib/supabase/types";

export function ThemeToggle({ initialTheme }: { initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? "light");

  useEffect(() => {
    const hasStored = typeof window !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY);
    if (!hasStored && initialTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage/perfil, solo disponible en el cliente
      setTheme(initialTheme);
      applyTheme(initialTheme);
    } else {
      setTheme(getStoredTheme());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

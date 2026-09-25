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
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border text-muted transition-all duration-150 active:scale-[0.93] hover:bg-surface-muted hover:text-foreground"
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${theme === "dark" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      />
    </button>
  );
}

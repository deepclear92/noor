"use client";

import { useEffect } from "react";
import { useReaderStore } from "@/lib/store";

/**
 * Applique le thème (light/dark/sepia/auto) sur l'élément <html>
 * dès le montage et à chaque changement de préférence.
 */
export function ThemeBootstrap() {
  const theme = useReaderStore((s) => s.prefs.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
    } else {
      root.setAttribute("data-theme", theme);
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return null;
}

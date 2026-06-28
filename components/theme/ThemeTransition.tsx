"use client";

import { useEffect } from "react";

/**
 * Adds a brief global color transition whenever the theme class on <html>
 * changes, so light <-> dark flips cross-fade smoothly instead of snapping.
 * Centralized via a MutationObserver so every theme toggle (settings, menu,
 * command palette) benefits without extra wiring. Respects reduced motion.
 */
export default function ThemeTransition() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver((mutations) => {
      const themeChanged = mutations.some(
        (m) => m.attributeName === "class" || m.attributeName === "style"
      );
      if (!themeChanged || reduceMotion.matches) return;

      root.classList.add("theme-anim");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        root.classList.remove("theme-anim");
      }, 520);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      root.classList.remove("theme-anim");
    };
  }, []);

  return null;
}

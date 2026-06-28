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

    // Signature of the current theme, ignoring our own transient helper class.
    const themeSignature = () =>
      Array.from(root.classList)
        .filter((c) => c !== "theme-anim")
        .sort()
        .join(" ") + `|${root.style.colorScheme}`;

    let lastSignature = themeSignature();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver(() => {
      const next = themeSignature();
      // Ignore mutations that don't change the theme (e.g. our own toggle).
      if (next === lastSignature) return;
      lastSignature = next;
      if (reduceMotion.matches) return;

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

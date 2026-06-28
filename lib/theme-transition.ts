type Origin = { x: number; y: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Apply a theme change with a smooth circular reveal using the View
 * Transitions API. The new theme wipes in from the toggle's position, so
 * light <-> dark switches glide cleanly instead of crossfading (which ghosts
 * differently-colored content like the wordmark). Falls back to an instant
 * apply when the API is unavailable or the user prefers reduced motion.
 */
export function switchTheme(apply: () => void, origin?: Origin | null): void {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  const doc = document as ViewTransitionDocument;
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || typeof doc.startViewTransition !== "function") {
    apply();
    return;
  }

  const transition = doc.startViewTransition(() => {
    apply();
  });

  const x = origin?.x ?? window.innerWidth - 48;
  const y = origin?.y ?? 32;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  transition.ready
    .then(() => {
      const root = document.documentElement;
      const duration = 520;
      const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
      // New theme wipes in from the toggle point...
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing,
          pseudoElement: "::view-transition-new(root)",
        }
      );
      // ...while the old theme dissolves out, so the moving edge softens
      // instead of showing a hard static black/white split.
      root.animate(
        { opacity: [1, 0] },
        {
          duration,
          easing: "ease-out",
          pseudoElement: "::view-transition-old(root)",
        }
      );
    })
    .catch(() => {
      /* no-op: transition may be skipped */
    });
}

/** Derive a reveal origin from a click event, when coordinates are available. */
export function originFromEvent(e?: {
  clientX?: number;
  clientY?: number;
}): Origin | null {
  if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
    if (e.clientX !== 0 || e.clientY !== 0) {
      return { x: e.clientX, y: e.clientY };
    }
  }
  return null;
}

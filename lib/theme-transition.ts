type Origin = { x: number; y: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Apply a theme change with a smooth full-screen dissolve using the View
 * Transitions API. The next theme fades in over a frozen snapshot of the
 * previous one, so there is no moving clip edge to flicker or tear — just a
 * clean crossfade. Falls back to an instant apply when the API is unavailable
 * or the user prefers reduced motion.
 */
export function switchTheme(apply: () => void, origin?: Origin | null): void {
  void origin; // accepted for API compatibility; dissolve needs no origin
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

  transition.ready
    .then(() => {
      const root = document.documentElement;
      // The new theme sits on top and fades in; the old snapshot stays fully
      // opaque underneath, so the result is a seamless dissolve with no hard
      // black/white seam and no clip-path glitch.
      root.animate(
        { opacity: [0, 1] },
        {
          duration: 480,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
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

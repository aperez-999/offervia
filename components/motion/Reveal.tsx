"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger index — multiplies the entrance delay for a cascading effect. */
  index?: number;
  /** Base delay in seconds before the entrance begins. */
  delay?: number;
  /** Travel distance (px) for the upward fade. */
  y?: number;
  /** When true, animate on scroll-into-view (once) instead of on mount. */
  scroll?: boolean;
  /** Fraction of the element visible before a scroll reveal fires. */
  amount?: number;
  className?: string;
};

/**
 * Fade-and-rise entrance for a block of content. Respects prefers-reduced-motion
 * by rendering instantly with no transform. Set `scroll` to reveal on scroll.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  y = 16,
  scroll = false,
  amount = 0.2,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const transition = {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1] as const,
    delay: delay + index * 0.07,
  };

  if (scroll) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;

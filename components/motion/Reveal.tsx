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
  className?: string;
};

/**
 * Fade-and-rise entrance for a block of content. Respects prefers-reduced-motion
 * by rendering instantly with no transform.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  y = 16,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: delay + index * 0.07,
      }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;

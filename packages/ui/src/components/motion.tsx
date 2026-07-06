"use client";

import { AnimatePresence, motion, type Transition, type Variants } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

/** Reusable transition presets (03_DRD §2.4). */
export const transitions = {
  fast: { duration: 0.12, ease: EASE_OUT },
  base: { duration: 0.2, ease: EASE_OUT },
  slow: { duration: 0.3, ease: EASE_OUT },
  exit: { duration: 0.15, ease: EASE_IN },
  spring: { type: "spring", stiffness: 400, damping: 30 },
} satisfies Record<string, Transition>;

/** Reusable variant presets: fade, scale, slide (03_DRD §9). */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

interface MotionProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds. */
  delay?: number;
}

/** Fade content in on mount. */
export const FadeIn = forwardRef<HTMLDivElement, MotionProps>(function FadeIn(
  { children, className, delay = 0 },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeVariants}
      transition={{ ...transitions.base, delay }}
    >
      {children}
    </motion.div>
  );
});

/** Scale + fade content in on mount. */
export const ScaleIn = forwardRef<HTMLDivElement, MotionProps>(function ScaleIn(
  { children, className, delay = 0 },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={scaleVariants}
      transition={{ ...transitions.base, delay }}
    >
      {children}
    </motion.div>
  );
});

export interface StaggerProps extends MotionProps {
  /** Seconds between children. */
  stagger?: number;
}

/** Stagger-reveal a list of children (03_DRD §9 briefing rows). */
export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  { children, className, stagger = 0.04 },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = forwardRef<HTMLDivElement, MotionProps>(function StaggerItem(
  { children, className },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={slideUpVariants}
      transition={transitions.base}
    >
      {children}
    </motion.div>
  );
});

export { AnimatePresence, motion };

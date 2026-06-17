import type { Transition, Variants } from "framer-motion";

export const spring = {
  press: { type: "spring", stiffness: 400, damping: 17 } as Transition,
  pop: { type: "spring", stiffness: 500, damping: 22 } as Transition,
  gentle: { type: "spring", stiffness: 260, damping: 24 } as Transition,
} as const;

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const phaseTransition: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/** A stamp-in: drops in slightly oversized + offset, then snaps to rest. */
export const slamIn: Variants = {
  initial: { opacity: 0, scale: 1.12, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
};

"use client";

/**
 * Burst — a one-shot celebratory particle burst (confetti / sparks).
 *
 * - A changing `fire` value triggers a fresh burst (keyed remount).
 * - Particles emit from the container center with random x/y/rotate, fall with a
 *   gravity-ish ease over 700–1200ms, then unmount.
 * - prefers-reduced-motion: renders a single static sparkle that fades — no motion.
 * - Pure visual, pointer-events-none, sits over its parent (parent must be relative).
 */

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BurstProps = {
  /** A changing value triggers a burst. Use a counter or a boolean flip. */
  fire: number | boolean;
  colors?: string[];
  count?: number;
  className?: string;
};

type Particle = {
  id: number;
  color: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  duration: number;
};

function makeParticles(count: number, colors: string[], seed: number): Particle[] {
  // Deterministic-ish per fire so re-renders during a burst stay stable.
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (seed % 7) * 0.31;
    const dist = 48 + Math.random() * 64;
    out.push({
      id: i,
      color: colors[i % colors.length],
      x: Math.cos(angle) * dist + (Math.random() - 0.5) * 24,
      // Bias downward for a gravity-ish settle.
      y: Math.sin(angle) * dist + 28 + Math.random() * 36,
      rotate: (Math.random() - 0.5) * 540,
      scale: 0.7 + Math.random() * 0.8,
      duration: 0.7 + Math.random() * 0.5,
    });
  }
  return out;
}

export function Burst({
  fire,
  colors = ["var(--color-safe)", "var(--color-gold)"],
  count = 14,
  className,
}: BurstProps) {
  const reduceMotion = useReducedMotion();

  // Normalize `fire` to a numeric key so booleans and counters both re-trigger.
  const fireKey = typeof fire === "boolean" ? (fire ? 1 : 0) : fire;

  const particles = useMemo(
    () => makeParticles(count, colors, Number(fireKey) || 0),
    // Re-roll only when a new burst fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fireKey, count]
  );

  // Don't render anything before the first burst.
  const armed = typeof fire === "boolean" ? fire : Number(fire) > 0;
  if (!armed) {
    return (
      <span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", className)}
      />
    );
  }

  if (reduceMotion) {
    // A single static sparkle that fades in/out — no movement.
    return (
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={fireKey}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: colors[0] }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible",
        className
      )}
    >
      <AnimatePresence>
        <span key={fireKey} className="absolute inset-0 flex items-center justify-center">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: p.scale, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
                rotate: p.rotate,
                scale: [p.scale, p.scale, p.scale * 0.6],
              }}
              transition={{
                duration: p.duration,
                ease: [0.22, 0.61, 0.36, 1], // ease-out-ish gravity settle
                opacity: { times: [0, 0.7, 1], duration: p.duration },
              }}
            />
          ))}
        </span>
      </AnimatePresence>
    </span>
  );
}

export default Burst;

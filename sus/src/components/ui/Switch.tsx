"use client";

/**
 * Switch — an animated, accessible toggle switch.
 *
 * - role="switch" + aria-checked, Space/Enter toggle, focus ring, ≥44px hit area.
 * - Thumb travels with a playful overshoot spring and snaps.
 * - Track color cross-fades muted → tone color when ON.
 * - When turning ON, emits a tiny sparkle puff from the thumb.
 * - Reduced-motion: instant thumb move, no sparkles.
 * - Does NOT play sound itself (the caller does).
 */

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SwitchTone = "safe" | "special" | "info" | "primary";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  tone?: SwitchTone;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
};

const toneColor: Record<SwitchTone, string> = {
  safe: "var(--color-safe)",
  special: "var(--color-special)",
  info: "var(--color-info)",
  primary: "var(--color-primary-1)",
};

// Track geometry (visual). Hit area is forced ≥44px via the wrapping button.
const TRACK_W = 56;
const TRACK_H = 32;
const THUMB = 24;
const PAD = (TRACK_H - THUMB) / 2; // 4
const TRAVEL = TRACK_W - THUMB - PAD * 2; // 24

// A few sparkle particles emitted from the thumb when switching ON.
const SPARKS = [
  { x: 10, y: -12, delay: 0 },
  { x: 16, y: 2, delay: 0.04 },
  { x: 4, y: 12, delay: 0.08 },
];

export function Switch({
  checked,
  onCheckedChange,
  tone = "safe",
  disabled = false,
  id,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const reduceMotion = useReducedMotion();
  // A changing key fires a one-shot sparkle burst (only on OFF→ON).
  const [burstKey, setBurstKey] = useState(0);

  const color = toneColor[tone];

  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    if (next && !reduceMotion) setBurstKey((k) => k + 1);
    onCheckedChange(next);
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        // ≥44px hit area while the visible track is smaller (centered inside).
        "relative inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center",
        "rounded-[var(--r-pill)] outline-none",
        "focus-visible:shadow-[var(--ring-focus)]",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      {/* Visible track */}
      <span
        aria-hidden
        className={cn(
          "relative block rounded-[var(--r-pill)]",
          "border border-[var(--glass-border)]",
          "transition-[background-color] duration-[var(--t-base)] ease-[var(--ease-out)]"
        )}
        style={{
          width: TRACK_W,
          height: TRACK_H,
          backgroundColor: checked ? color : "var(--glass-2)",
        }}
      >
        {/* Thumb */}
        <motion.span
          className="absolute top-1/2 left-0 rounded-full bg-white shadow-[var(--shadow-sm)]"
          style={{ width: THUMB, height: THUMB, marginTop: -THUMB / 2 }}
          initial={false}
          animate={{ x: checked ? TRAVEL + PAD : PAD }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 500, damping: 22 }
          }
        >
          {/* Sparkle puff — emitted from the thumb on OFF→ON. */}
          {!reduceMotion && (
            <AnimatePresence>
              {burstKey > 0 && (
                <span
                  key={burstKey}
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                >
                  {SPARKS.map((s, i) => (
                    <motion.span
                      key={i}
                      className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color, marginLeft: -3, marginTop: -3 }}
                      initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                      animate={{ scale: [0, 1, 0], opacity: [1, 1, 0], x: s.x, y: s.y }}
                      transition={{ duration: 0.5, delay: s.delay, ease: "easeOut" }}
                    />
                  ))}
                </span>
              )}
            </AnimatePresence>
          )}
        </motion.span>
      </span>
    </button>
  );
}

export default Switch;

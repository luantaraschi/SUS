"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion";

type CounterProps = {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement: boolean;
  disableIncrement: boolean;
  /** When set, tints the label + value (e.g. the Impostores stepper). */
  accent?: "imp";
};

const stepButton =
  "flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] transition-[transform,background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9";

/** +/- numeric stepper used for lobby settings (players / rounds / impostors). */
export default function Counter({
  label,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
  accent,
}: CounterProps) {
  const reduceMotion = useReducedMotion();
  const [direction, setDirection] = useState(1);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setDirection(value > prevValue ? 1 : -1);
    setPrevValue(value);
  }

  const isImp = accent === "imp";
  // The impostor "danger" pulse only fires when more than one impostor is set.
  const dangerActive = isImp && value > 1;

  const labelColor = isImp ? "text-[var(--color-imp)]" : "text-[var(--color-text-muted)]";
  const valueColor = isImp ? "text-[var(--color-imp)]" : "text-[var(--color-text)]";

  return (
    <div className="flex min-w-[96px] flex-col items-center gap-1.5">
      <span
        className={`font-condensed text-xs uppercase tracking-[0.18em] ${labelColor} sm:text-sm`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          aria-label={`Diminuir ${label}`}
          className={stepButton}
        >
          <Icon icon="solar:minus-circle-bold" width={20} height={20} />
        </button>
        <div className="relative flex h-11 w-12 items-center justify-center overflow-hidden sm:h-12 sm:w-12">
          {/* Impostor danger glow — a soft imp-tinted pulse keyed to the value so it
              re-fires whenever the count lands on >1 (no effect+setState needed). */}
          {dangerActive && !reduceMotion && (
            <motion.span
              key={`glow-${value}`}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[var(--r-md)]"
              initial={{ opacity: 0, boxShadow: "0 0 0px 0px rgba(255,87,123,0)" }}
              animate={{
                opacity: [0, 1, 0],
                boxShadow: [
                  "0 0 0px 0px rgba(255,87,123,0)",
                  "0 0 22px 2px rgba(255,87,123,0.45)",
                  "0 0 0px 0px rgba(255,87,123,0)",
                ],
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.span
              key={value}
              custom={direction}
              variants={{
                initial: (dir: number) =>
                  reduceMotion ? { opacity: 0 } : { y: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 1 },
                // The digit is "struck": a one-frame scale kick as it settles.
                animate: reduceMotion
                  ? { y: "0%", opacity: 1, scale: 1 }
                  : { y: "0%", opacity: 1, scale: [1, 1.18, 1] },
                exit: (dir: number) =>
                  reduceMotion ? { opacity: 0 } : { y: dir > 0 ? "-100%" : "100%", opacity: 0 },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={spring.pop}
              className={`tnum absolute text-center font-display text-3xl ${valueColor} sm:text-4xl`}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disableIncrement}
          aria-label={`Aumentar ${label}`}
          className={stepButton}
        >
          <Icon icon="solar:add-circle-bold" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

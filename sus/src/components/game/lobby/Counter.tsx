"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type CounterProps = {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement: boolean;
  disableIncrement: boolean;
};

const stepButton =
  "flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] transition-[transform,background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10";

/** +/- numeric stepper used for lobby settings (players / rounds / impostors). */
export default function Counter({
  label,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
}: CounterProps) {
  const reduceMotion = useReducedMotion();
  const [direction, setDirection] = useState(1);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setDirection(value > prevValue ? 1 : -1);
    setPrevValue(value);
  }

  return (
    <div className="flex min-w-[104px] flex-col items-center gap-1.5">
      <span className="font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:text-sm">
        {label}
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          aria-label={`Diminuir ${label}`}
          className={stepButton}
        >
          <Icon icon="solar:minus-circle-bold" width={20} height={20} />
        </button>
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.span
              key={value}
              custom={direction}
              variants={{
                initial: (dir: number) =>
                  reduceMotion ? { opacity: 0 } : { y: dir > 0 ? "100%" : "-100%", opacity: 0 },
                animate: { y: "0%", opacity: 1 },
                exit: (dir: number) =>
                  reduceMotion ? { opacity: 0 } : { y: dir > 0 ? "-100%" : "100%", opacity: 0 },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="tnum absolute text-center font-display text-3xl text-[var(--color-text)] sm:text-5xl"
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

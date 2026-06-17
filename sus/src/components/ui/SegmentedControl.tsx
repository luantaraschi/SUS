"use client";

/**
 * SegmentedControl — a segmented selector with a single sliding highlight pill.
 *
 * - The active highlight is ONE element that physically slides between segments
 *   via framer `layoutId` + spring.pop.
 * - role="radiogroup" with role="radio" segments, arrow-key navigation, focus ring.
 * - Selected label cross-fades to white; unselected to --color-text.
 * - Reduced-motion: the pill teleports (layout transition disabled).
 */

import { useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SegmentedTone = "primary" | "info";

export type SegmentOption = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
};

export type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (v: string) => void;
  tone?: SegmentedTone;
  "aria-label"?: string;
};

const toneFill: Record<SegmentedTone, string> = {
  primary: "var(--color-primary-1)",
  info: "var(--color-info)",
};

export function SegmentedControl({
  options,
  value,
  onChange,
  tone = "primary",
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const fill = toneFill[tone];
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  const focusIndex = (i: number) => {
    const n = options.length;
    const next = ((i % n) + n) % n;
    onChange(options[next].value);
    btnRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusIndex(i + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusIndex(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusIndex(options.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full items-stretch gap-1 rounded-[var(--r-md)] p-1",
        "border border-[var(--glass-border)]"
      )}
      style={{ backgroundColor: "var(--glass-2)" }}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            // Roving tabindex: only the active segment is in the tab order.
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative flex min-h-10 flex-1 items-center justify-center gap-1.5",
              "rounded-[var(--r-sm)] px-3 text-sm font-medium",
              "outline-none transition-[transform] duration-[var(--t-quick)] active:scale-[0.96]",
              "focus-visible:shadow-[var(--ring-focus)]"
            )}
          >
            {/* Sliding highlight pill — shared layoutId moves it between segments. */}
            {selected && (
              <motion.span
                layoutId={`seg-thumb-${groupId}`}
                aria-hidden
                className="absolute inset-0 rounded-[var(--r-sm)] shadow-[var(--shadow-sm)]"
                style={{ backgroundColor: fill }}
                transition={reduceMotion ? { duration: 0 } : spring.pop}
              />
            )}
            <span
              className={cn(
                "relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap",
                "transition-[color] duration-[var(--t-quick)] ease-[var(--ease-out)]"
              )}
              style={{ color: selected ? "#fff" : "var(--color-text)" }}
            >
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

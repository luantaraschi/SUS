"use client";

/**
 * Slider — a styled, accessible range slider with a lively thumb.
 *
 * - Real native <input type="range"> underneath for full keyboard/a11y support.
 * - Filled track grows with value (tone color).
 * - Thumb scales 1 → 1.25 on grab/active and casts a soft colored glow.
 * - Reduced-motion: thumb still works; glow/scale disabled.
 * - Generic on purpose (callers may layer extra visuals on top).
 */

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type SliderTone = "safe" | "gold" | "info" | "primary";

export type SliderProps = {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  tone?: SliderTone;
  disabled?: boolean;
  "aria-label"?: string;
};

const toneColor: Record<SliderTone, string> = {
  safe: "var(--color-safe)",
  gold: "var(--color-gold)",
  info: "var(--color-info)",
  primary: "var(--color-primary-1)",
};

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  tone = "primary",
  disabled = false,
  "aria-label": ariaLabel,
}: SliderProps) {
  const styleId = useId();
  const [active, setActive] = useState(false);
  const color = toneColor[tone];

  const range = max - min || 1;
  const pct = Math.min(100, Math.max(0, ((value - min) / range) * 100));

  // Scope thumb styling to this instance so multiple sliders can differ in tone.
  const cls = `sus-slider-${styleId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className={cn("relative flex h-11 w-full items-center", disabled && "opacity-50")}>
      {/* Track background + filled portion (purely visual, behind the input). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-[var(--r-pill)]"
        style={{ backgroundColor: "var(--glass-2)" }}
      >
        <div
          className="h-full rounded-[var(--r-pill)] transition-[width] duration-[var(--t-micro)] ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <input
        type="range"
        className={cn(cls, "sus-slider relative z-10 m-0 h-11 w-full cursor-pointer bg-transparent")}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onValueChange(Number(e.target.value))}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      />

      <style>{`
        .${cls} {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
        }
        .${cls}::-webkit-slider-runnable-track {
          background: transparent;
          height: 100%;
        }
        .${cls}::-moz-range-track {
          background: transparent;
          height: 100%;
        }
        .${cls}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 2px solid ${color};
          box-shadow: var(--shadow-sm);
          transition: transform var(--t-quick) var(--spring-playful),
            box-shadow var(--t-quick) var(--ease-out);
          transform: scale(${active ? 1.25 : 1});
          ${active ? `box-shadow: 0 0 0 8px color-mix(in srgb, ${color} 28%, transparent), var(--shadow-sm);` : ""}
        }
        .${cls}::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 2px solid ${color};
          box-shadow: var(--shadow-sm);
          transition: transform var(--t-quick) var(--spring-playful),
            box-shadow var(--t-quick) var(--ease-out);
          transform: scale(${active ? 1.25 : 1});
          ${active ? `box-shadow: 0 0 0 8px color-mix(in srgb, ${color} 28%, transparent), var(--shadow-sm);` : ""}
        }
        .${cls}:focus-visible::-webkit-slider-thumb {
          box-shadow: var(--ring-focus);
        }
        .${cls}:focus-visible::-moz-range-thumb {
          box-shadow: var(--ring-focus);
        }
        @media (prefers-reduced-motion: reduce) {
          .${cls}::-webkit-slider-thumb {
            transform: scale(1);
            box-shadow: var(--shadow-sm);
            transition: none;
          }
          .${cls}::-moz-range-thumb {
            transform: scale(1);
            box-shadow: var(--shadow-sm);
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Slider;

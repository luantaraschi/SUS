"use client";

import { InputHTMLAttributes } from "react";

type InputState = "default" | "focus" | "error";
type InputVariant = "text" | "code";

interface GameInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  state?: InputState;
  variant?: InputVariant;
  maxLength?: number;
}

const STATE_STYLES: Record<InputState, string> = {
  default: "border-surface-primary/40 focus:border-game-info focus:shadow-[0_0_0_3px_rgba(0,184,235,0.25)]",
  focus: "border-game-info shadow-[0_0_0_3px_rgba(0,184,235,0.25)]",
  error: "border-game-impostor shadow-[0_0_0_3px_rgba(255,87,123,0.25)]",
};

export default function GameInput({
  label,
  value,
  onChange,
  placeholder,
  state = "default",
  variant = "text",
  maxLength,
  ...rest
}: GameInputProps) {
  const isCode = variant === "code";

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="font-condensed text-xs uppercase tracking-widest text-[var(--panel-soft-text)]">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full rounded-pill border-[3px] bg-[var(--control-surface)] px-5 py-3 text-center
          font-display text-xl text-[var(--control-text)] sm:px-6 sm:py-4 sm:text-2xl
          outline-none transition-all duration-200
          placeholder:text-[var(--control-soft-text)]
          ${STATE_STYLES[state]}
          ${isCode ? "tracking-widest text-2xl sm:text-3xl uppercase font-bold" : ""}
        `}
        {...rest}
      />
    </div>
  );
}

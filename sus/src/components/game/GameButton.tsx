"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type ButtonVariant = "filled" | "outline" | "danger" | "success";
type ButtonSize = "lg" | "md" | "sm";

interface GameButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  filled:
    "bg-[#1e1b6e] text-white border-[#1e1b6e] shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-1 active:shadow-none",
  outline:
    "bg-[var(--control-surface)] text-[var(--control-text)] border-[var(--control-border)] shadow-[0_4px_0_rgba(30,27,110,0.18)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(30,27,110,0.2)] active:translate-y-1 active:shadow-none",
  danger:
    "bg-game-impostor text-white border-game-impostor shadow-[0_4px_0_theme(colors.game.impostor)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_theme(colors.game.impostor)] active:translate-y-1 active:shadow-none",
  success:
    "bg-game-safe text-surface-primary border-game-safe shadow-[0_4px_0_theme(colors.game.safe)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_theme(colors.game.safe)] active:translate-y-1 active:shadow-none",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  lg: "h-[60px] sm:h-16 px-8 text-xl sm:text-2xl gap-3",
  md: "h-12 sm:h-[52px] px-6 text-lg gap-2",
  sm: "h-9 px-4 text-base gap-1.5",
};

export default function GameButton({
  variant = "filled",
  size = "md",
  icon,
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: GameButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex w-full items-center justify-center
        rounded-xl border-[3px] font-display uppercase tracking-widest
        transition-all duration-200 mb-1
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${disabled ? "pointer-events-none border-[var(--control-disabled-border)] bg-[var(--control-disabled-bg)] text-[var(--control-disabled-text)] opacity-100 shadow-none" : "cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)]"}
        ${className}
      `}
    >
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}

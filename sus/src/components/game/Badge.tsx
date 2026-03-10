"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "impostor" | "safe" | "info" | "warning";
  className?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  default: "bg-surface-primary text-white",
  impostor: "bg-game-impostor text-white",
  safe: "bg-game-safe text-surface-primary",
  info: "bg-game-info text-white",
  warning: "bg-game-warning text-white",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 font-display text-xs uppercase tracking-wider ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

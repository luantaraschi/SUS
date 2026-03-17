"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface GameCircleProps {
  children: ReactNode;
  className?: string;
}

export default function GameCircle({ children, className = "" }: GameCircleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-panel relative mx-auto flex w-full max-w-[700px] flex-col overflow-hidden rounded-[36px] border border-white/[0.12] bg-white/[0.07] text-[var(--panel-text)] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl ${className}`}
    >
      <div className="relative z-10 flex h-full w-full flex-col">{children}</div>
    </motion.div>
  );
}

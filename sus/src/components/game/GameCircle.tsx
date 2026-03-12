"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

interface GameCircleProps {
  children: ReactNode;
  className?: string;
}

export default function GameCircle({ children, className = "" }: GameCircleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative mx-auto flex flex-col items-center justify-center bg-white flex-shrink-0 w-full max-w-md sm:max-w-[480px] shadow-[0_8px_40px_rgba(0,0,0,0.18)] border-2 border-white/30 rounded-[2rem] ${className}`}
    >
      <div className="relative z-20 flex w-full h-full flex-col items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}

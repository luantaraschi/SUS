"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  running?: boolean;
  className?: string;
}

export default function Timer({
  seconds,
  onComplete,
  running = true,
  className = "",
}: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, remaining, onComplete]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isLow = remaining <= 10;

  return (
    <div
      className={`font-mono text-4xl font-bold tracking-wider ${
        isLow ? "animate-bounce-result text-game-impostor" : "text-white"
      } ${className}`}
    >
      {display}
    </div>
  );
}

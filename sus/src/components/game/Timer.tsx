"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playSound } from "@/lib/sound";

interface TimerProps {
  endsAt: number | null | undefined;
  className?: string;
}

export default function Timer({ endsAt, className = "" }: TimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const prevTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      return;
    }

    // Reset prevTickRef when the target changes so a stale tick value from a
    // previous countdown doesn't suppress the first tick of the new one.
    prevTickRef.current = null;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [endsAt]);

  const remainingSeconds = useMemo(() => {
    if (!endsAt) {
      return 0;
    }
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  }, [endsAt, now]);

  // Play a tick sound once per whole second when ≤10s remain
  useEffect(() => {
    if (remainingSeconds > 0 && remainingSeconds <= 10 && remainingSeconds !== prevTickRef.current) {
      prevTickRef.current = remainingSeconds;
      playSound("timer.tick");
    }
    if (remainingSeconds === 0) {
      prevTickRef.current = null;
    }
  }, [remainingSeconds]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  const toneClass =
    remainingSeconds <= 10
      ? "animate-bounce-result text-[var(--color-imp)]"
      : remainingSeconds <= 30
        ? "text-[var(--color-warn)]"
        : "text-[var(--color-info)]";

  return (
    <div
      aria-live="polite"
      className={`font-mono text-4xl font-bold tracking-wider sm:text-5xl ${toneClass} ${className}`}
    >
      <span className="tnum">{display}</span>
    </div>
  );
}

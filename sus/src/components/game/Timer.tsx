"use client";

import { useEffect, useMemo, useState } from "react";

interface TimerProps {
  endsAt: number | null | undefined;
  className?: string;
}

export default function Timer({ endsAt, className = "" }: TimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) {
      return;
    }

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

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  const toneClass =
    remainingSeconds <= 10
      ? "animate-bounce-result text-game-impostor"
      : remainingSeconds <= 30
        ? "text-game-warning"
        : "text-game-info";

  return (
    <div className={`font-mono text-4xl font-bold tracking-wider sm:text-5xl ${toneClass} ${className}`}>
      {display}
    </div>
  );
}

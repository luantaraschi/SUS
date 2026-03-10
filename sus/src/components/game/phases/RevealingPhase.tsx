import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

interface RevealingPhaseProps {
  round: any;
  players: any[];
}

export function RevealingPhase({ round, players }: RevealingPhaseProps) {
  const [countdown, setCountdown] = useState(3);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (countdown > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-white/70 font-display text-xl mb-4">Revelando respostas em...</h2>
        <div key={countdown} className="text-8xl font-black text-white font-display animate-ping" style={{ animationDuration: '1s', animationIterationCount: 1 }}>
          {countdown}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <h2 className="font-display text-3xl text-white mb-8">Respostas</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {answers?.map((answer, i) => {
          const player = players.find(p => p._id === answer.playerId);
          if (!player) return null;

          return (
            <div
              key={answer._id}
              style={{ animationDelay: `${i * 150}ms` }}
              className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center text-center animate-in slide-in-from-bottom-8 fade-in fill-mode-both duration-500"
            >
              <div className="flex flex-col items-center mb-3">
                <span className="text-3xl mb-1">{player.emoji}</span>
                <span className="font-condensed text-black/50 text-xs uppercase font-bold tracking-wider">{player.name}</span>
              </div>
              <p className="font-body text-xl font-medium text-black break-words w-full">
                "{answer.text}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

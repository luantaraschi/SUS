import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";

interface RevealingPhaseProps {
  round: any;
  players: any[];
  room: any;
  myPlayer: any;
  myRole?: any;
  sessionId: string;
}

export function RevealingPhase({ round, players, room, myPlayer, myRole, sessionId }: RevealingPhaseProps) {
  const [countdown, setCountdown] = useState(3);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const advancePhase = useMutation(api.rounds.advanceToVoting);
  const isHost = myPlayer?.isHost === true;

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
                <PlayerAvatar name={player.name} avatarSeed={player.emoji} size="sm" hideName />
                <span className="mt-1.5 font-hand text-surface-primary/60 text-sm flex items-center gap-1">
                  [{player.name}]
                  {myPlayer.role === "master" && myRole?.masterImpostorIds?.includes(player._id) && (
                    <span className="text-game-impostor font-bold ml-1 text-xs uppercase" title="Impostor">🤡</span>
                  )}
                </span>
              </div>
              <p className="font-body text-xl font-medium text-black break-words w-full">
                "{answer.text}"
              </p>
            </div>
          );
        })}
      </div>

      {isHost && (
        <div className="mt-8 w-full max-w-sm mx-auto">
          <Button
            onClick={() => advancePhase({ roundId: round._id, sessionId })}
            className="w-full py-6 text-lg font-bold"
          >
            Continuar para Votação
          </Button>
        </div>
      )}

      {!isHost && (
        <p className="mt-8 text-white/60 text-center font-medium">Aguardando o host continuar...</p>
      )}
    </div>
  );
}

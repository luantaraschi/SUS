import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

interface RevealingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

export function RevealingPhase({
  round,
  players,
  myPlayer,
  myRole,
  sessionId,
}: RevealingPhaseProps) {
  const [countdown, setCountdown] = useState(3);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const advancePhase = useMutation(api.rounds.advanceToVoting);
  const isHost = myPlayer.isHost;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  if (countdown > 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-4 font-display text-xl text-white/70">Revelando respostas em...</h2>
        <div
          key={countdown}
          className="animate-ping font-display text-8xl font-black text-white"
          style={{ animationDuration: "1s", animationIterationCount: 1 }}
        >
          {countdown}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-start p-4 animate-in fade-in duration-500">
      <h2 className="mb-8 font-display text-3xl text-white">Respostas</h2>

      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
        {answers?.map((answer, index) => {
          const player = players.find((currentPlayer) => currentPlayer._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);

          return (
            <div
              key={answer._id}
              style={{ animationDelay: `${index * 150}ms` }}
              className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-lg animate-in slide-in-from-bottom-8 fade-in fill-mode-both duration-500"
            >
              <div className="mb-3 flex flex-col items-center">
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  size="sm"
                  hideName
                />
                <span className="mt-1.5 flex items-center gap-1 font-hand text-sm text-surface-primary/60">
                  [{player.name}]
                  {isMarkedByMaster && (
                    <span className="ml-1 text-xs font-bold uppercase text-game-impostor" title="Impostor">
                      🤡
                    </span>
                  )}
                </span>
              </div>
              <p className="w-full break-words font-body text-xl font-medium text-black">
                &quot;{answer.text}&quot;
              </p>
            </div>
          );
        })}
      </div>

      {isHost ? (
        <div className="mx-auto mt-8 w-full max-w-sm">
          <Button
            onClick={() => void advancePhase({ roundId: round._id, sessionId })}
            className="w-full py-6 text-lg font-bold"
          >
            Continuar para Votacao
          </Button>
        </div>
      ) : (
        <p className="mt-8 text-center font-medium text-white/60">Aguardando o host continuar...</p>
      )}
    </div>
  );
}

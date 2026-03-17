import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
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
  myRole,
}: RevealingPhaseProps) {
  const [now, setNow] = useState(() => Date.now());
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const countdownRemaining = useMemo(() => {
    if (!round.revealedAt) {
      return 0;
    }

    return Math.max(0, 3 - Math.floor((now - round.revealedAt) / 1000));
  }, [now, round.revealedAt]);

  const showAnswers = countdownRemaining === 0;

  if (!showAnswers) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center px-4">
        <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-8" />
        <h2 className="mb-4 font-display text-xl text-white/70">Revelando respostas em...</h2>
        <div className="font-display text-8xl font-black text-white">{countdownRemaining}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center px-4 py-8">
      <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-6" />
      <div className="w-full rounded-[32px] border border-white/10 bg-black/20 px-5 py-4 text-center backdrop-blur-md">
        <h2 className="font-display text-3xl text-white">Respostas reveladas</h2>
        <p className="mt-2 font-body text-white/75">
          A discussao comeca automaticamente assim que esta revelacao terminar.
        </p>
        <Timer endsAt={round.phaseEndsAt} className="mt-4" />
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {answers?.map((answer, index) => {
          const player = players.find((currentPlayer) => currentPlayer._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);

          return (
            <ReactionAnchor key={answer._id} playerId={String(player._id)}>
              <div
                style={{ animationDelay: `${index * 80}ms` }}
                className="rounded-[28px] border border-white/10 bg-(--panel-surface) p-5 text-center text-(--panel-text) shadow-lg animate-in slide-in-from-bottom-8 fade-in duration-500"
              >
                <div className="mb-3 flex flex-col items-center">
                  <PlayerAvatar
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    size="sm"
                    hideName
                  />
                  <span className="mt-1.5 flex items-center gap-1 font-hand text-sm text-(--panel-soft-text)">
                    [{player.name}]
                    {isMarkedByMaster && (
                      <span className="ml-1 text-xs font-bold uppercase text-game-impostor" title="Impostor">
                        ?
                      </span>
                    )}
                  </span>
                </div>
                <p className="w-full wrap-break-word font-body text-xl font-medium">
                  &quot;{answer.text}&quot;
                </p>
              </div>
            </ReactionAnchor>
          );
        })}
      </div>
    </div>
  );
}

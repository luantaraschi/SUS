"use client";

import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import PhaseIndicator from "../PhaseIndicator";
import SpeakingOrbit from "../SpeakingOrbit";
import { GlassSection } from "../ui/glass";

interface SpeakingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

export function SpeakingPhase({
  round,
  players,
  myPlayer,
  myRole,
  sessionId,
}: SpeakingPhaseProps) {
  const speakingState = useQuery(api.rounds.getSpeakingState, {
    roundId: round._id,
  });
  const passTurn = useMutation(api.rounds.passTurn);
  const requestVoting = useMutation(api.rounds.requestVoting);

  const isHost = myPlayer.isHost;
  const isImpostor = myRole?.isImpostor ?? false;

  if (!speakingState) {
    return (
      <div className="flex h-[calc(100dvh-1.5rem)] items-center justify-center sm:h-[calc(100dvh-2rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-primary border-t-transparent" />
      </div>
    );
  }

  const { speakingOrder, currentSpeakerIndex, votingRequestedBy } = speakingState;
  const orderedPlayers = speakingOrder
    .map((id) => players.find((player) => player._id === id))
    .filter(Boolean) as PublicPlayer[];
  const currentSpeaker = orderedPlayers[currentSpeakerIndex] ?? null;
  const isMyTurn = currentSpeaker?._id === myPlayer._id;

  const humanActive = players.filter(
    (player) => player.status !== "disconnected" && !player.isBot
  );
  const majority = Math.ceil(humanActive.length / 2);
  const hasRequestedVoting = votingRequestedBy.includes(myPlayer._id);
  const privateLabel = isImpostor
    ? myRole?.secretContent
      ? `Voce e o SUS - dica: ${myRole.secretContent}`
      : "Voce e o SUS"
    : `Sua palavra: ${myRole?.secretContent ?? "???"}`;

  return (
    <div className="mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden px-3 py-2 sm:h-[calc(100dvh-2rem)] sm:px-4 sm:py-3">
      <div className="shrink-0">
        <PhaseIndicator currentPhase="speaking" mode="word" className="justify-center" />

        <div className="mt-3 flex justify-center">
          <GlassSection className="max-w-[min(92vw,680px)] rounded-full px-4 py-2 sm:px-5">
            <p className="truncate text-center font-body text-sm text-white/88 sm:text-base">
              {privateLabel}
            </p>
          </GlassSection>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-2">
        <SpeakingOrbit
          players={orderedPlayers}
          currentSpeakerIndex={currentSpeakerIndex}
          myPlayerId={myPlayer._id}
          centerContent={
            <div className="space-y-2">
              <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-white/54">
                Vez de
              </p>
              <p className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-none text-white">
                {currentSpeaker?.name ?? "..."}
              </p>
              <p className="mx-auto max-w-[240px] font-body text-sm leading-relaxed text-white/68 sm:max-w-[280px]">
                {isMyTurn
                  ? "Sua vez de falar."
                  : `Aguardando ${currentSpeaker?.name ?? "o jogador atual"}.`}
              </p>
            </div>
          }
        />
      </div>

      <div className="shrink-0 pb-1">
        <GlassSection className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-[28px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-center font-body text-sm text-white/72">
            {isMyTurn ? "Passe a vez quando terminar." : "A rodada segue na ordem sorteada."}
          </p>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Button
              onClick={() =>
                void passTurn({
                  roundId: round._id,
                  playerId: myPlayer._id,
                  sessionId,
                })
              }
              disabled={!isMyTurn}
              className="h-[48px] flex-1 rounded-[20px] border border-white/12 bg-white text-[15px] font-semibold text-[#1a0b3d] shadow-[0_12px_28px_rgba(255,255,255,0.14)] hover:bg-white disabled:border-white/8 disabled:bg-white/20 disabled:text-white/42"
            >
              {isMyTurn ? "Ja falei" : "Aguardando sua vez"}
            </Button>

            <div className="flex flex-col gap-2 lg:w-[320px]">
              <Button
                onClick={() =>
                  void requestVoting({
                    roundId: round._id,
                    playerId: myPlayer._id,
                    sessionId,
                  })
                }
                disabled={hasRequestedVoting && !isHost}
                className={cn(
                  "h-[48px] rounded-[20px] border text-[14px] font-semibold",
                  hasRequestedVoting && !isHost
                    ? "border-amber-300/12 bg-amber-300/10 text-amber-50/55"
                    : "border-amber-300/18 bg-amber-300/16 text-amber-50 hover:bg-amber-300/22"
                )}
              >
                {isHost
                  ? "Iniciar Votacao (Host)"
                  : hasRequestedVoting
                    ? "Voto registrado"
                    : "Pedir votacao"}
              </Button>

              <p className="text-center font-condensed text-[11px] uppercase tracking-[0.22em] text-white/52">
                Consenso {votingRequestedBy.length}/{majority} votos
              </p>
            </div>
          </div>
        </GlassSection>
      </div>
    </div>
  );
}

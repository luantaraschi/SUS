"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gavel, MessageCircle, Vote } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import PhaseIndicator from "../PhaseIndicator";
import SpeakingOrbit from "../SpeakingOrbit";
import { GlassSection } from "../ui/glass";
import { playSound } from "@/lib/sound";

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
  const reduceMotion = useReducedMotion() ?? false;
  const speakingState = useQuery(api.rounds.getSpeakingState, {
    roundId: round._id,
  });
  const passTurn = useMutation(api.rounds.passTurn);
  const requestVoting = useMutation(api.rounds.requestVoting);

  const isHost = myPlayer.isHost;
  const isImpostor = myRole?.isImpostor ?? false;

  // track previous speaker index to detect "becomes my turn"
  const prevSpeakerIndexRef = useRef<number | null>(null);
  // track previous voting-request count to detect threshold crossing
  const prevVotingCountRef = useRef<number>(0);

  const currentSpeakerIndex = speakingState?.currentSpeakerIndex ?? null;
  const speakingOrder = speakingState?.speakingOrder ?? [];
  const votingRequestedBy = speakingState?.votingRequestedBy ?? [];

  const resolvedCurrentSpeaker =
    currentSpeakerIndex !== null
      ? (speakingOrder
          .map((id) => players.find((p) => p._id === id))
          .filter(Boolean) as PublicPlayer[])[currentSpeakerIndex] ?? null
      : null;
  const isMyTurnNow = resolvedCurrentSpeaker?._id === myPlayer._id;

  const humanActiveCount = players.filter(
    (p) => p.status !== "disconnected" && !p.isBot
  ).length;
  const majorityThreshold = Math.ceil(humanActiveCount / 2);

  // turn.you — fire when currentSpeakerIndex changes and it's now my turn
  useEffect(() => {
    if (currentSpeakerIndex === null) return;
    if (isMyTurnNow && prevSpeakerIndexRef.current !== currentSpeakerIndex) {
      playSound("turn.you");
    }
    prevSpeakerIndexRef.current = currentSpeakerIndex;
  }, [currentSpeakerIndex, isMyTurnNow]);

  // vote.consensus — fire when votingRequestedBy crosses the majority threshold
  useEffect(() => {
    const count = votingRequestedBy.length;
    if (
      count >= majorityThreshold &&
      majorityThreshold > 0 &&
      prevVotingCountRef.current < majorityThreshold
    ) {
      playSound("vote.consensus");
    }
    prevVotingCountRef.current = count;
  }, [votingRequestedBy.length, majorityThreshold]);

  if (!speakingState) {
    return (
      <div className="flex h-[calc(100dvh-1.5rem)] items-center justify-center sm:h-[calc(100dvh-2rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--w-16)] border-t-[var(--color-info)]" />
      </div>
    );
  }

  const orderedPlayers = speakingState.speakingOrder
    .map((id) => players.find((player) => player._id === id))
    .filter(Boolean) as PublicPlayer[];
  const currentSpeaker = orderedPlayers[speakingState.currentSpeakerIndex] ?? null;
  const isMyTurn = currentSpeaker?._id === myPlayer._id;

  const hasRequestedVoting = speakingState.votingRequestedBy.includes(myPlayer._id);
  const voteCount = speakingState.votingRequestedBy.length;
  const votesRemaining = Math.max(0, majorityThreshold - voteCount);
  const consensusReached = majorityThreshold > 0 && voteCount >= majorityThreshold;

  const privateLabel = isImpostor
    ? myRole?.secretContent
      ? `Voce e o SUS - dica: ${myRole.secretContent}`
      : "Voce e o SUS"
    : `Sua palavra: ${myRole?.secretContent ?? "???"}`;

  // Consensus helper copy — clear majority-rule explanation.
  const consensusCopy = isHost
    ? "Como host, voce inicia a votacao na hora."
    : consensusReached
      ? "Consenso atingido! Indo para a votacao."
      : votesRemaining === 1
        ? "Falta 1 voto para iniciar a votacao."
        : `Faltam ${votesRemaining} votos para iniciar a votacao.`;

  return (
    <div className="mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden px-3 py-2 sm:h-[calc(100dvh-2rem)] sm:px-4 sm:py-3">
      <div className="shrink-0">
        <PhaseIndicator currentPhase="speaking" mode="word" className="justify-center" />

        <div className="mt-3 flex justify-center">
          <GlassSection className="max-w-[min(92vw,680px)] rounded-[var(--r-pill)] px-4 py-2 sm:px-5">
            <p className="truncate text-center font-body text-sm text-[var(--color-text)] sm:text-base">
              {privateLabel}
            </p>
          </GlassSection>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-2">
        <SpeakingOrbit
          players={orderedPlayers}
          currentSpeakerIndex={speakingState.currentSpeakerIndex}
          myPlayerId={myPlayer._id}
          centerContent={
            <div className="space-y-2">
              <p
                className={cn(
                  "font-condensed text-[11px] uppercase tracking-[0.28em]",
                  isMyTurn ? "text-[var(--color-gold)]" : "text-[var(--text-dim)]"
                )}
              >
                {isMyTurn ? "Sua vez de falar" : "Vez de"}
              </p>

              {/* Turn-handoff name swap: out goes up/fades, in pops up. */}
              <div className="relative flex min-h-[clamp(2rem,4vw,3.2rem)] items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={currentSpeaker?._id ?? "none"}
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.82, y: 10 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.9, y: -10 }
                    }
                    transition={reduceMotion ? { duration: 0.18 } : spring.pop}
                    className={cn(
                      "font-display text-[clamp(2rem,4vw,3.2rem)] leading-none",
                      isMyTurn ? "text-[var(--color-gold)]" : "text-[var(--color-text)]"
                    )}
                  >
                    {currentSpeaker?.name ?? "..."}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="mx-auto max-w-[240px] font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:max-w-[280px]">
                {isMyTurn
                  ? "Da sua pista sem entregar a palavra."
                  : `Ouca ${currentSpeaker?.name ?? "o jogador atual"} com atencao.`}
              </p>
            </div>
          }
        />
      </div>

      <div className="shrink-0 pb-1">
        <GlassSection className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-[var(--r-xl)] px-4 py-3 sm:px-5 sm:py-4">
          {/* "Sua vez" banner — unmistakable when it's the local player's turn. */}
          <AnimatePresence initial={false} mode="wait">
            {isMyTurn ? (
              <motion.div
                key="my-turn"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring.gentle}
                className="flex items-center justify-center gap-2 rounded-[var(--r-md)] border border-[color-mix(in_srgb,var(--color-gold)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] px-4 py-2 text-center"
              >
                <MessageCircle size={16} className="text-[var(--color-gold)]" />
                <p className="font-display text-sm uppercase tracking-widest text-[var(--color-gold)]">
                  E a sua vez de falar
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="watching"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring.gentle}
                className="text-center font-body text-sm text-[var(--color-text-muted)]"
              >
                A rodada segue na ordem sorteada. Passe a vez quando for o seu momento.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            <Button
              onClick={() =>
                void passTurn({
                  roundId: round._id,
                  playerId: myPlayer._id,
                  sessionId,
                })
              }
              disabled={!isMyTurn}
              className={cn(
                "h-[52px] flex-1 rounded-[var(--r-md)] border text-[15px] font-semibold transition-[transform,background-color] duration-[var(--t-quick)]",
                isMyTurn
                  ? "border-[var(--glass-border)] bg-white text-[var(--color-primary-press)] shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:bg-white"
                  : "border-[var(--w-08)] bg-[var(--glass-1)] text-[var(--text-dim)]"
              )}
            >
              {isMyTurn ? (
                <>
                  <Check size={18} />
                  Ja falei
                </>
              ) : (
                "Aguardando sua vez"
              )}
            </Button>

            <div className="flex flex-col gap-2 lg:w-[340px]">
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
                  "h-[52px] rounded-[var(--r-md)] border text-[14px] font-semibold transition-[transform,background-color] duration-[var(--t-quick)] active:scale-[0.98]",
                  isHost
                    ? "border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)] text-[var(--color-gold)] hover:bg-[color-mix(in_srgb,var(--color-gold)_26%,transparent)]"
                    : hasRequestedVoting
                      ? "border-[color-mix(in_srgb,var(--color-safe)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)] text-[var(--color-safe)]"
                      : "border-[color-mix(in_srgb,var(--color-gold)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] text-[var(--color-gold)] hover:bg-[color-mix(in_srgb,var(--color-gold)_22%,transparent)]"
                )}
              >
                {isHost ? (
                  <>
                    <Gavel size={16} />
                    Iniciar votacao (Host)
                  </>
                ) : hasRequestedVoting ? (
                  <>
                    <Check size={16} />
                    Voto registrado
                  </>
                ) : (
                  <>
                    <Vote size={16} />
                    Pedir votacao
                  </>
                )}
              </Button>

              {/* Consensus counter — clear majority-rule copy + dot progress. */}
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-[var(--r-sm)] border px-3 py-2 text-center transition-colors duration-[var(--t-quick)]",
                  consensusReached
                    ? "border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
                    : "border-[var(--w-08)] bg-[var(--w-04)]"
                )}
              >
                <p
                  className={cn(
                    "font-condensed text-[11px] uppercase tracking-[0.18em]",
                    consensusReached
                      ? "text-[var(--color-safe)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {consensusCopy}
                </p>

                {!isHost && (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: majorityThreshold }).map((_, i) => {
                      const filled = i < voteCount;
                      return (
                        <motion.span
                          key={i}
                          aria-hidden
                          animate={{ scale: filled ? 1 : 0.7 }}
                          transition={reduceMotion ? { duration: 0 } : spring.pop}
                          className={cn(
                            "h-2 w-2 rounded-[var(--r-pill)]",
                            filled
                              ? consensusReached
                                ? "bg-[var(--color-safe)]"
                                : "bg-[var(--color-gold)]"
                              : "bg-[var(--w-16)]"
                          )}
                        />
                      );
                    })}
                    <span className="tnum ml-1 font-condensed text-[11px] text-[var(--text-dim)]">
                      {voteCount}/{majorityThreshold}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassSection>
      </div>
    </div>
  );
}

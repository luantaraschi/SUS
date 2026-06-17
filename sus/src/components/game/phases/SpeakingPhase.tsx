"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gavel, Mic, Send, Vote } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getActivePlayers } from "@/lib/players";
import PhaseIndicator from "../PhaseIndicator";
import SpeakingOrbit from "../SpeakingOrbit";
import Burst from "@/components/ui/Burst";
import { playSound } from "@/lib/sound";

interface SpeakingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

// Playful overshoot for the "sua vez" beat — local to this screen.
const SPRING_PLAYFUL = { type: "spring", stiffness: 320, damping: 16 } as const;

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

  // Per-effect first-run sentinels — each effect seeds its own guard independently.
  // prevSpeakerIndexRef: undefined = not yet seeded (first run).
  const prevSpeakerIndexRef = useRef<number | null | undefined>(undefined);
  // track previous voting-request count to detect threshold crossing
  const prevVotingCountRef = useRef<number>(0);
  // consensusSeededRef: false until the vote.consensus effect has seeded itself.
  const consensusSeededRef = useRef(false);
  // signature halo pulse + consensus burst counters (drive one-shot visuals)
  const [haloPulse, setHaloPulse] = useState(0);
  const [consensusBurst, setConsensusBurst] = useState(0);
  // paper-plane fly-up on pass
  const [planeFly, setPlaneFly] = useState(0);

  const currentSpeakerIndex = speakingState?.currentSpeakerIndex ?? null;
  const speakingOrder = speakingState?.speakingOrder ?? [];
  const votingRequestedBy = speakingState?.votingRequestedBy ?? [];

  const resolvedCurrentSpeaker =
    currentSpeakerIndex !== null
      ? (players.find((p) => p._id === speakingOrder[currentSpeakerIndex]) ?? null)
      : null;
  const isMyTurnNow = resolvedCurrentSpeaker?._id === myPlayer._id;

  const humanActiveCount = getActivePlayers(players).length;
  const majorityThreshold = Math.ceil(humanActiveCount / 2);

  // turn.you — fire when currentSpeakerIndex changes and it's now my turn.
  // The signature halo pulse is synced to this same beat (never duplicated).
  // Uses its OWN first-run sentinel (prevSpeakerIndexRef === undefined).
  useEffect(() => {
    if (prevSpeakerIndexRef.current === undefined) {
      // First run: seed without playing, regardless of currentSpeakerIndex value.
      prevSpeakerIndexRef.current = currentSpeakerIndex;
      return;
    }
    if (isMyTurnNow && prevSpeakerIndexRef.current !== currentSpeakerIndex) {
      playSound("turn.you");
      // Schedule outside synchronous effect body to satisfy React Compiler rules.
      window.setTimeout(() => setHaloPulse((n) => n + 1), 0);
    }
    prevSpeakerIndexRef.current = currentSpeakerIndex;
  }, [currentSpeakerIndex, isMyTurnNow]);

  // vote.consensus — fire when votingRequestedBy crosses the majority threshold.
  // The mint/gold Burst is synced to this same crossing.
  // Uses its OWN first-run sentinel (consensusSeededRef) so it never shares state
  // with the turn.you effect above.
  useEffect(() => {
    const count = votingRequestedBy.length;
    if (!consensusSeededRef.current) {
      // First run: seed ref without playing
      prevVotingCountRef.current = count;
      consensusSeededRef.current = true;
      return;
    }
    if (
      count >= majorityThreshold &&
      majorityThreshold > 0 &&
      prevVotingCountRef.current < majorityThreshold
    ) {
      playSound("vote.consensus");
      // Schedule outside synchronous effect body to satisfy React Compiler rules.
      window.setTimeout(() => setConsensusBurst((n) => n + 1), 0);
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
  const currentSpeaker =
    players.find((p) => p._id === speakingState.speakingOrder[speakingState.currentSpeakerIndex]) ??
    null;
  const isMyTurn = currentSpeaker?._id === myPlayer._id;

  const hasRequestedVoting = speakingState.votingRequestedBy.includes(myPlayer._id);
  const voteCount = speakingState.votingRequestedBy.length;
  const votesRemaining = Math.max(0, majorityThreshold - voteCount);
  const consensusReached = majorityThreshold > 0 && voteCount >= majorityThreshold;

  // Private word secrecy preserved: crew sees their word, impostor never does.
  const privateWord = isImpostor
    ? myRole?.secretContent
      ? `Dica: ${myRole.secretContent}`
      : "Sem palavra"
    : (myRole?.secretContent ?? "???");

  // Consensus helper copy — clear majority-rule explanation.
  const consensusCopy = isHost
    ? "Como host, voce inicia a votacao na hora."
    : consensusReached
      ? "Consenso atingido! Indo para a votacao."
      : votesRemaining === 1
        ? "Falta 1 voto para iniciar a votacao."
        : `Faltam ${votesRemaining} votos para iniciar a votacao.`;

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden px-3 py-2 sm:h-[calc(100dvh-2rem)] sm:px-4 sm:py-3">
      <div className="shrink-0">
        <PhaseIndicator currentPhase="speaking" mode="word" className="justify-center" />
      </div>

      {/* ROLE CHIP HUD — asymmetric top-left. Crew = safe mint solid chip with
          the word; impostor = dashed rose outline (no word to reveal). */}
      <div className="pointer-events-none absolute left-3 top-12 z-30 sm:left-4 sm:top-14">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, y: -6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={reduceMotion ? { duration: 0.2 } : spring.gentle}
          className={cn(
            "flex max-w-[68vw] items-center gap-2 rounded-[var(--r-pill)] px-3 py-1.5 backdrop-blur-[var(--blur-sm)] sm:max-w-[300px] sm:px-3.5 sm:py-2",
            isImpostor
              ? "border border-dashed bg-[color-mix(in_srgb,var(--color-imp)_8%,transparent)]"
              : "border bg-[color-mix(in_srgb,var(--color-safe)_14%,transparent)]"
          )}
          style={{
            borderColor: isImpostor
              ? "color-mix(in srgb, var(--color-imp) 60%, transparent)"
              : "color-mix(in srgb, var(--color-safe) 40%, transparent)",
          }}
        >
          <span
            className={cn(
              "shrink-0 font-condensed text-[9px] uppercase tracking-[0.22em]",
              isImpostor ? "text-[var(--color-imp)]" : "text-[var(--color-safe)]"
            )}
          >
            {isImpostor ? "Voce e o SUS" : "Sua palavra"}
          </span>
          <span
            className={cn(
              "truncate font-display text-sm leading-none sm:text-base",
              isImpostor ? "text-[var(--color-imp)]" : "text-[var(--color-text)]"
            )}
          >
            {privateWord}
          </span>
        </motion.div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-2">
        <SpeakingOrbit
          players={orderedPlayers}
          currentSpeakerIndex={speakingState.currentSpeakerIndex}
          myPlayerId={myPlayer._id}
          isMyTurn={isMyTurn}
          centerContent={
            isMyTurn ? (
              // YOUR TURN — center morphs to a breathing gold microphone module.
              <motion.div
                key="mic-module"
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.18 } : SPRING_PLAYFUL}
                className="relative flex flex-col items-center gap-2"
              >
                {/* One-shot gold halo pulse, synced to turn.you. */}
                {!reduceMotion && (
                  <motion.span
                    key={haloPulse}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-7 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in srgb, var(--color-gold) 50%, transparent), transparent 70%)",
                    }}
                    initial={{ scale: 0.4, opacity: 0.8 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                )}
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          scale: [1, 1.08, 1],
                          filter: [
                            "drop-shadow(0 0 6px rgba(255,215,106,0.4))",
                            "drop-shadow(0 0 18px rgba(255,215,106,0.85))",
                            "drop-shadow(0 0 6px rgba(255,215,106,0.4))",
                          ],
                        }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)]"
                  style={{ willChange: "transform" }}
                >
                  <Mic size={26} className="text-[var(--color-gold)]" />
                </motion.div>
                <p className="font-display text-[clamp(1.1rem,2.6vw,1.6rem)] uppercase leading-none tracking-[0.08em] text-[var(--color-gold)]">
                  Manda a sua pista
                </p>
                <p className="mx-auto max-w-[220px] font-body text-xs leading-relaxed text-[var(--color-text-muted)] sm:max-w-[260px] sm:text-sm">
                  Da sua dica sem entregar a palavra.
                </p>
              </motion.div>
            ) : (
              // WATCHING — name swap with left->right spark wipe on arrival.
              <div className="space-y-2">
                <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                  Vez de
                </p>

                <div className="relative flex min-h-[clamp(2rem,4vw,3.2rem)] items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
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
                      className="relative"
                    >
                      <p className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-none text-[var(--color-text)]">
                        {currentSpeaker?.name ?? "..."}
                      </p>
                      {/* Left->right spark/underline wipe on arrival. */}
                      {!reduceMotion && (
                        <motion.span
                          key={`wipe-${currentSpeaker?._id ?? "none"}`}
                          aria-hidden
                          className="absolute -bottom-1 left-0 h-[3px] rounded-[var(--r-pill)]"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, var(--color-info), transparent)",
                          }}
                          initial={{ width: "0%", opacity: 0 }}
                          animate={{
                            width: ["0%", "100%", "100%"],
                            opacity: [0, 1, 0],
                            x: ["0%", "0%", "10%"],
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <p className="mx-auto max-w-[240px] font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:max-w-[280px]">
                  {`Ouca ${currentSpeaker?.name ?? "o jogador atual"} com atencao.`}
                </p>
              </div>
            )
          }
        />
      </div>

      {/* STAGE CONSOLE rail — slimmer, belongs to the circle. */}
      <div className="relative shrink-0 pb-1">
        {/* Consensus mint wave sweeps left->right across the console, synced to
            vote.consensus. */}
        {!reduceMotion && consensusBurst > 0 && (
          <motion.span
            key={`wave-${consensusBurst}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-[var(--r-xl)]"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-safe) 30%, transparent), transparent)",
              mixBlendMode: "screen",
            }}
            initial={{ x: "-110%", opacity: 0.9 }}
            animate={{ x: "110%", opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        )}
        <Burst fire={consensusBurst} colors={["var(--color-safe)", "var(--color-gold)"]} />

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-3 backdrop-blur-[var(--blur-md)] sm:px-5">
          {/* "Sua vez" banner — overshoots in with a mic wiggle. */}
          <AnimatePresence initial={false} mode="wait">
            {isMyTurn ? (
              <motion.div
                key="my-turn"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14 } }}
                transition={reduceMotion ? { duration: 0.18 } : SPRING_PLAYFUL}
                className="flex items-center justify-center gap-2 rounded-[var(--r-md)] border border-[color-mix(in_srgb,var(--color-gold)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] px-4 py-2 text-center"
              >
                <motion.span
                  animate={
                    reduceMotion
                      ? undefined
                      : { rotate: [0, -14, 12, -8, 0] }
                  }
                  transition={
                    reduceMotion ? undefined : { duration: 0.6, ease: "easeInOut" }
                  }
                  className="inline-flex"
                >
                  <Mic size={16} className="text-[var(--color-gold)]" />
                </motion.span>
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

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
            {/* PASS BUTTON — wide glowing gold primary on your turn (breathing
                ring), quiet ghost when watching. */}
            <motion.div
              className="relative flex-1"
              whileHover={isMyTurn && !reduceMotion ? { y: -2 } : undefined}
              transition={spring.press}
            >
              {/* Breathing gold ring behind the button — only on your turn. */}
              {isMyTurn && !reduceMotion && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-[var(--r-md)]"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-gold) 40%, transparent)",
                    filter: "blur(8px)",
                  }}
                  animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.99, 1.02, 0.99] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <Button
                onClick={() => {
                  if (isMyTurn && !reduceMotion) setPlaneFly((n) => n + 1);
                  void passTurn({
                    roundId: round._id,
                    playerId: myPlayer._id,
                    sessionId,
                  });
                }}
                disabled={!isMyTurn}
                className={cn(
                  "relative h-[52px] w-full rounded-[var(--r-md)] border text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-[var(--t-quick)] active:scale-[0.96]",
                  isMyTurn
                    ? "border-[color-mix(in_srgb,var(--color-gold)_50%,transparent)] bg-[linear-gradient(180deg,var(--color-gold),color-mix(in_srgb,var(--color-gold)_82%,#000))] text-[var(--color-primary-press)] shadow-[var(--shadow-md)]"
                    : "border-[var(--w-08)] bg-transparent text-[var(--text-dim)]"
                )}
              >
                {isMyTurn ? (
                  <span className="relative inline-flex items-center gap-2">
                    {/* Check -> paper-plane morph that flies up on pass. */}
                    <AnimatePresence mode="wait" initial={false}>
                      {planeFly > 0 ? (
                        <motion.span
                          key={`plane-${planeFly}`}
                          initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                          animate={{ opacity: 0, y: -28, x: 14, rotate: -18 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="inline-flex"
                        >
                          <Send size={18} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.15 }}
                          className="inline-flex"
                        >
                          <Check size={18} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    Ja falei
                  </span>
                ) : (
                  "Aguardando sua vez"
                )}
              </Button>
            </motion.div>

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
                  "h-[52px] rounded-[var(--r-md)] border text-[14px] font-semibold transition-[transform,background-color] duration-[var(--t-quick)] active:scale-[0.96]",
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
                    <motion.span
                      key={`count-${voteCount}`}
                      initial={reduceMotion ? false : { scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={reduceMotion ? { duration: 0 } : spring.pop}
                      className="tnum ml-1 font-condensed text-[11px] text-[var(--text-dim)]"
                    >
                      {voteCount}/{majorityThreshold}
                    </motion.span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

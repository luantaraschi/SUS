"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gavel, Pin, Search, ShieldAlert, Vote } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import { Burst } from "@/components/ui/Burst";
import { playSound } from "@/lib/sound";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getActivePlayers } from "@/lib/players";
import { getCenteredOddGridItemClass } from "@/lib/utils";
import { GlassPanel, GlassSection } from "../ui/glass";
import { fadeInUp, scaleIn, spring } from "@/lib/motion";

interface EvidencePhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

// Evidence-board-local choreography: testimony cards pin onto the corkboard one
// after another, each settling with a gentle spring. Local to this screen.
const boardContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const boardCard = {
  initial: { opacity: 0, y: 18, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.gentle },
};

// Tiny deterministic tilt per card so the board reads "hand-pinned" not gridded.
const TILTS = [-1.6, 1.4, -1, 1.8, -1.4, 1.1, -0.8, 1.5];

export function EvidencePhase({
  round,
  players,
  myPlayer,
  myRole,
  room,
  sessionId,
}: EvidencePhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [showQuestion, setShowQuestion] = useState(false);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const requestAdvance = useMutation(api.rounds.requestAdvanceToVoting);

  const isMaster = round.masterId === myPlayer._id;
  const isHost = myPlayer.isHost;
  const isSpectator = myPlayer.isSpectator;

  const activePlayers = getActivePlayers(players).filter(
    (p) => p._id !== round.masterId
  );
  const readyCount = round.evidenceReadyBy?.length ?? 0;
  const majority = Math.ceil(activePlayers.length / 2);
  const hasVoted = round.evidenceReadyBy?.includes(myPlayer._id) ?? false;
  const consensusReached = majority > 0 && readyCount >= majority;

  // vote.consensus — fire once when readyCount crosses the majority threshold.
  // Uses a "fire once" guard ref so the burst/sound also triggers when majority
  // DECREASES to a value already met by the current readyCount (e.g. disconnect).
  // The ref resets when readyCount drops below majority so it can re-arm.
  const consensusFiredRef = useRef(false);
  const [consensusBurst, setConsensusBurst] = useState(0);
  useEffect(() => {
    if (readyCount >= majority && majority > 0 && !consensusFiredRef.current) {
      consensusFiredRef.current = true;
      playSound("vote.consensus");
      window.setTimeout(() => setConsensusBurst((n) => n + 1), 0);
    } else if (readyCount < majority || majority === 0) {
      consensusFiredRef.current = false;
    }
  }, [readyCount, majority]);

  // 2-3 seconds after mount, reveal the normal question (preserved delay).
  useEffect(() => {
    const timer = window.setTimeout(() => setShowQuestion(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleRequestVoting = () => {
    void requestAdvance({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center px-4 py-8">
      {/* Phase indicator */}
      <motion.div
        variants={reduceMotion ? {} : fadeInUp}
        initial="initial"
        animate="animate"
        transition={spring.gentle}
        className="mb-6 w-full"
      >
        <PhaseIndicator
          currentPhase="evidence"
          mode={round.mode}
          questionMode={room.questionMode}
          className="justify-center"
        />
      </motion.div>

      {/* CASE PROMPT — the master's pinned question, styled as the case file
          header. Loading "dossier" card morphs into the pinned prompt once the
          showQuestion delay elapses (the signature reveal of this screen). */}
      <AnimatePresence mode="wait">
        {showQuestion && round.questionMain ? (
          <motion.div
            key="question"
            variants={reduceMotion ? {} : scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ...spring.gentle }}
            className="relative mb-7 w-full max-w-2xl"
          >
            {/* Pin head crowning the case prompt — drops in on reveal. */}
            {!reduceMotion && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0, y: -10, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...spring.pop, delay: 0.12 }}
                className="pointer-events-none absolute -top-2 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-info)_50%,transparent)] bg-[var(--glass-2)] text-[var(--color-info)] shadow-[var(--shadow-sm)]"
              >
                <Pin size={13} />
              </motion.span>
            )}

            <GlassPanel
              tone="info"
              className="relative overflow-hidden rounded-[var(--r-2xl)] px-5 py-6 text-center sm:px-7 sm:py-7"
            >
              <div className="flex items-center justify-center gap-2">
                <Search size={13} className="text-[var(--color-info)]" />
                <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
                  Pergunta da rodada
                </p>
              </div>
              <h2 className="mt-3 font-display text-2xl text-[var(--color-text)] md:text-3xl">
                {round.questionMain}
              </h2>
              {/* Microcopy */}
              <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Comparem as respostas — o impostor pode ter escorregado.
              </p>

              {/* Timer urgency (like Discussion) — only when the phase is timed. */}
              {round.phaseEndsAt != null && (
                <div className="mt-4 flex items-center justify-center">
                  <Timer endsAt={round.phaseEndsAt} className="justify-center" />
                </div>
              )}
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            variants={reduceMotion ? {} : scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring.gentle}
            className="mb-7 w-full max-w-2xl"
          >
            <GlassSection className="relative overflow-hidden rounded-[var(--r-2xl)] px-5 py-6 text-center sm:px-7 sm:py-7">
              {/* Scanning sweep while the board "develops" the testimony. */}
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-info) 22%, transparent), transparent)",
                  }}
                  initial={{ x: "-120%" }}
                  animate={{ x: "260%" }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className="relative z-10">
                <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
                  Reunindo os depoimentos
                </p>
                <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">
                  Quadro de Evidencias
                </h2>
                <p className="mt-2 font-body text-sm text-[var(--color-text-muted)]">
                  Analisem as respostas de todos...
                </p>
              </div>
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVIDENCE BOARD — testimony cards pinned to the corkboard. Each tilts
          slightly and carries a hand-font name tag pin. */}
      <motion.div
        variants={reduceMotion ? undefined : boardContainer}
        initial="initial"
        animate="animate"
        className="mt-1 grid w-full grid-cols-1 gap-5 md:grid-cols-2"
      >
        {answers?.map((answer, index) => {
          const player = players.find((p) => p._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" &&
            myRole.masterImpostorIds?.includes(player._id);
          const tilt = reduceMotion ? 0 : TILTS[index % TILTS.length];

          return (
            <ReactionAnchor
              key={answer._id}
              playerId={String(player._id)}
              className={getCenteredOddGridItemClass(
                index,
                answers?.length ?? 0,
                "md"
              )}
            >
              <motion.div
                variants={reduceMotion ? undefined : boardCard}
                style={reduceMotion ? undefined : { rotate: tilt }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : { rotate: 0, y: -4, scale: 1.015 }
                }
                transition={spring.gentle}
                className="relative"
              >
                {/* Pushpin holding the testimony to the board. */}
                {!reduceMotion && (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -top-2.5 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-[var(--r-pill)] border shadow-[var(--shadow-sm)]",
                      isMarkedByMaster
                        ? "border-[color-mix(in_srgb,var(--color-imp)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_22%,transparent)] text-[var(--color-imp)]"
                        : "border-[var(--glass-border)] bg-[var(--glass-2)] text-[var(--color-info)]"
                    )}
                  >
                    <Pin size={12} />
                  </span>
                )}

                <GlassSection
                  className={cn(
                    "relative h-full rounded-[var(--r-xl)] px-5 pb-5 pt-7 text-center shadow-[var(--shadow-md)]",
                    isMarkedByMaster &&
                      "border-[color-mix(in_srgb,var(--color-imp)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_8%,transparent)]"
                  )}
                >
                  {/* Master-only suspect flag — discreet rose ribbon. */}
                  {isMarkedByMaster && (
                    <span
                      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-imp)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_14%,transparent)] px-2 py-0.5 font-condensed text-[9px] uppercase tracking-[0.18em] text-[var(--color-imp)]"
                      title="Impostor"
                    >
                      <ShieldAlert size={10} />
                      SUS
                    </span>
                  )}

                  <div className="mb-3 flex flex-col items-center">
                    <PlayerAvatar
                      name={player.name}
                      avatarSeed={player.emoji}
                      imageUrl={player.avatarImageUrl}
                      size="sm"
                      hideName
                    />
                    {/* Hand-font name tag, as the design uses elsewhere. */}
                    <span className="mt-1.5 flex items-center gap-1 font-hand text-sm text-[var(--color-text-muted)]">
                      [{player.name}]
                    </span>
                  </div>
                  <p className="w-full break-words font-body text-xl font-medium text-[var(--color-text)]">
                    &quot;{answer.text}&quot;
                  </p>
                </GlassSection>
              </motion.div>
            </ReactionAnchor>
          );
        })}
      </motion.div>

      {/* ADVANCE CONTROL — same treatment as Speaking/Voting: press feedback,
          consensus dots that pop, and a mint wave + Burst when the table agrees. */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            key="actions"
            variants={reduceMotion ? {} : fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ...spring.gentle, delay: 0.1 }}
            className="relative mx-auto mt-9 w-full max-w-md"
          >
            {/* Consensus mint wave sweeps across the console, synced to the
                vote.consensus crossing. */}
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
            <Burst
              fire={consensusBurst}
              colors={["var(--color-safe)", "var(--color-gold)"]}
            />

            <div className="flex w-full flex-col gap-3">
              {!isMaster && !isSpectator && (
                <motion.div
                  className="relative"
                  whileHover={hasVoted || reduceMotion ? undefined : { y: -2 }}
                  whileTap={hasVoted || reduceMotion ? undefined : { scale: 0.96 }}
                  transition={spring.press}
                >
                  <Button
                    className={cn(
                      "h-[52px] w-full rounded-[var(--r-md)] border text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-[var(--t-quick)] active:scale-[0.96]",
                      hasVoted
                        ? "border-[color-mix(in_srgb,var(--color-safe)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)] text-[var(--color-safe)]"
                        : "border-[var(--glass-border)] bg-white text-[var(--color-primary-press)] shadow-[var(--shadow-md)] hover:bg-white"
                    )}
                    disabled={hasVoted}
                    onClick={handleRequestVoting}
                  >
                    {hasVoted ? (
                      <>
                        <Check size={16} />
                        Aguardando... ({readyCount}/{majority} votos)
                      </>
                    ) : (
                      <>
                        <Vote size={16} />
                        {`Ir para Votacao (${readyCount}/${majority})`}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {isHost && !hasVoted && (
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  transition={spring.press}
                >
                  <Button
                    className="h-[48px] w-full rounded-[var(--r-md)] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] text-[14px] font-semibold text-[var(--color-gold)] transition-[transform,background-color] duration-[var(--t-quick)] hover:bg-[color-mix(in_srgb,var(--color-gold)_22%,transparent)]"
                    onClick={handleRequestVoting}
                  >
                    <Gavel size={15} />
                    Forcar Votacao (Host)
                  </Button>
                </motion.div>
              )}

              {(isMaster || isSpectator) && (
                <p className="text-center font-body text-sm text-[var(--color-text-muted)]">
                  {isMaster
                    ? "O mestre observa esta rodada."
                    : "Voce esta como espectador."}
                </p>
              )}

              {/* Consensus counter — clear majority-rule copy + dot progress. */}
              <div
                className={cn(
                  "flex flex-wrap items-center justify-center gap-2 rounded-[var(--r-sm)] border px-3 py-2 text-center transition-colors duration-[var(--t-quick)]",
                  consensusReached
                    ? "border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
                    : "border-[var(--w-08)] bg-[var(--w-04)]"
                )}
              >
                <p
                  className={cn(
                    "font-condensed text-[11px] uppercase tracking-[0.22em]",
                    consensusReached
                      ? "text-[var(--color-safe)]"
                      : "text-[var(--color-text-muted)]"
                  )}
                >
                  {readyCount}/{majority} votos para avancar
                </p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: majority }).map((_, i) => {
                    const filled = i < readyCount;
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
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

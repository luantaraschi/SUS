"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gavel, Search } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getCenteredOddGridItemClass } from "@/lib/utils";
import { GlassPanel, GlassSection } from "../ui/glass";
import {
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  spring,
} from "@/lib/motion";

interface EvidencePhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

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

  const activePlayers = players.filter(
    (p) =>
      p.status !== "disconnected" &&
      !p.isSpectator &&
      !p.isBot &&
      p._id !== round.masterId
  );
  const readyCount = round.evidenceReadyBy?.length ?? 0;
  const majority = Math.ceil(activePlayers.length / 2);
  const hasVoted = round.evidenceReadyBy?.includes(myPlayer._id) ?? false;

  // 2-3 seconds after mount, reveal the normal question
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

      {/* Question reveal (appears after 2-3s) — or loading card */}
      <AnimatePresence mode="wait">
        {showQuestion && round.questionMain ? (
          <motion.div
            key="question"
            variants={reduceMotion ? {} : scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ...spring.gentle }}
            className="mb-6 w-full"
          >
            <GlassPanel
              tone="info"
              className="rounded-[var(--r-2xl)] px-5 py-5 text-center sm:px-7 sm:py-6"
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
                Comparem as respostas com atencao — o impostor pode ter escorregado.
              </p>
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
            className="mb-6 w-full"
          >
            <GlassSection className="rounded-[var(--r-2xl)] px-5 py-5 text-center sm:px-7 sm:py-6">
              <h2 className="font-display text-2xl text-[var(--color-text)]">
                Quadro de Evidencias
              </h2>
              <p className="mt-2 font-body text-sm text-[var(--color-text-muted)]">
                Analisem as respostas de todos...
              </p>
            </GlassSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer cards grid */}
      <motion.div
        variants={reduceMotion ? {} : staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-2"
      >
        {answers?.map((answer, index) => {
          const player = players.find((p) => p._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" &&
            myRole.masterImpostorIds?.includes(player._id);

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
                variants={reduceMotion ? {} : staggerItem}
                transition={{ ...spring.gentle, delay: index * 0.06 }}
              >
                <GlassSection className="rounded-[var(--r-xl)] p-5 text-center shadow-[var(--shadow-md)]">
                  <div className="mb-3 flex flex-col items-center">
                    <PlayerAvatar
                      name={player.name}
                      avatarSeed={player.emoji}
                      imageUrl={player.avatarImageUrl}
                      size="sm"
                      hideName
                    />
                    <span className="mt-1.5 flex items-center gap-1 font-hand text-sm text-[var(--color-text-muted)]">
                      [{player.name}]
                      {isMarkedByMaster && (
                        <span
                          className="ml-1 text-xs font-bold uppercase text-[var(--color-imp)]"
                          title="Impostor"
                        >
                          ?
                        </span>
                      )}
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

      {/* Voting request / advance buttons */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            key="actions"
            variants={reduceMotion ? {} : fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ ...spring.gentle, delay: 0.1 }}
            className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3"
          >
            {!isMaster && !isSpectator && (
              <Button
                className={cn(
                  "h-[52px] w-full rounded-[var(--r-md)] border text-[15px] font-semibold transition-[transform,background-color] duration-[var(--t-quick)]",
                  hasVoted
                    ? "border-[color-mix(in_srgb,var(--color-safe)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)] text-[var(--color-safe)]"
                    : "border-[var(--glass-border)] bg-white text-[var(--color-primary-press)] shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:bg-white"
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
                  `Ir para Votacao (${readyCount}/${majority})`
                )}
              </Button>
            )}

            {isHost && !hasVoted && (
              <Button
                className="h-[48px] w-full rounded-[var(--r-md)] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_14%,transparent)] text-[14px] font-semibold text-[var(--color-gold)] hover:bg-[color-mix(in_srgb,var(--color-gold)_22%,transparent)]"
                onClick={handleRequestVoting}
              >
                <Gavel size={15} />
                Forcar Votacao (Host)
              </Button>
            )}

            {(isMaster || isSpectator) && (
              <p className="text-center font-body text-sm text-[var(--color-text-muted)]">
                {isMaster
                  ? "O mestre observa esta rodada."
                  : "Voce esta como espectador."}
              </p>
            )}

            {/* Votes progress indicator */}
            <div className="flex items-center justify-center gap-2 rounded-[var(--r-sm)] border border-[var(--w-08)] bg-[var(--w-04)] px-3 py-2">
              <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
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
                          ? readyCount >= majority
                            ? "bg-[var(--color-safe)]"
                            : "bg-[var(--color-gold)]"
                          : "bg-[var(--w-16)]"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

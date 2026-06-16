"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Eye, Gavel, HelpCircle } from "lucide-react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getCenteredOddGridItemClass } from "@/lib/utils";
import { GlassPanel, GlassSection } from "../ui/glass";
import { fadeInUp, scaleIn, staggerContainer, staggerItem, spring } from "@/lib/motion";
import { playSound } from "@/lib/sound";

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

interface VotingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

export function VotingPhase({ round, players, myPlayer, myRole, room, sessionId }: VotingPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [selectedSuspect, setSelectedSuspect] = useState<Id<"players"> | null>(null);
  const submitVote = useMutation(api.votes.submitVote);
  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  const isMasterMode = room ? isMasterQuestionMode(room) : false;
  const answers = useQuery(api.answers.getAnswersByRound, isMasterMode ? { roundId: round._id } : "skip");

  const isMaster = round.masterId === myPlayer._id;
  const isSpectator = myPlayer.isSpectator ?? false;
  const canVote = !isMaster && !isSpectator;

  // Candidate list mirrors the server's voting-player filter (excludes
  // disconnected players, the master, and spectators).
  const activePlayers = players.filter(
    (player) =>
      player.status !== "disconnected" &&
      !player.isSpectator &&
      player._id !== round.masterId
  );
  const totalVoters = activePlayers.length;

  const myVote = votes?.find((vote) => vote.voterId === myPlayer._id);
  const hasVoted = Boolean(myVote);
  const votedVoterIds = useMemo(() => new Set(votes?.map((vote) => vote.voterId)), [votes]);

  // Votes received per candidate (tally from targetId).
  const voteCountByCandidate = useMemo(() => {
    const map = new Map<string, number>();
    for (const vote of votes ?? []) {
      map.set(String(vote.targetId), (map.get(String(vote.targetId)) ?? 0) + 1);
    }
    return map;
  }, [votes]);

  const handleVote = async () => {
    if (!selectedSuspect || hasVoted || !canVote) return;

    await submitVote({
      roundId: round._id,
      voterId: myPlayer._id,
      sessionId,
      suspectId: selectedSuspect,
    });
    playSound("vote.cast");
  };

  // Upfront, before-the-action notice for non-voters.
  const nonVoterNotice = isMaster
    ? "Mestre nao vota nesta rodada — voce observa e consulta as respostas."
    : isSpectator
      ? "Voce esta como espectador — acompanhe a votacao sem votar."
      : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center px-4 py-8">
      {/* Header */}
      <motion.div
        variants={reduceMotion ? {} : fadeInUp}
        initial="initial"
        animate="animate"
        transition={spring.gentle}
        className="w-full text-center"
      >
        <PhaseIndicator
          currentPhase="voting"
          mode={round.mode}
          questionMode={room?.questionMode}
          className="mb-4 justify-center"
        />
        <h2 className="font-display text-3xl text-[var(--color-text)] md:text-4xl">
          Quem e o impostor?
        </h2>
        <p className="mt-2 font-body text-sm text-[var(--color-text-muted)] sm:text-base">
          {canVote
            ? "Escolha um suspeito e confirme seu voto."
            : "Acompanhe a votacao da mesa."}
        </p>

        {!isMasterMode && <Timer endsAt={round.phaseEndsAt} className="mt-4" />}

        <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--w-08)] bg-[var(--w-04)] px-4 py-1.5">
          <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            <span className="tnum text-[var(--color-text)]">{votes?.length ?? 0}</span>
            /{totalVoters} votos enviados
          </span>
        </div>
      </motion.div>

      {/* Upfront non-voter banner — shown BEFORE the cards. */}
      {nonVoterNotice && (
        <motion.div
          variants={reduceMotion ? {} : scaleIn}
          initial="initial"
          animate="animate"
          transition={spring.gentle}
          className="mt-5 w-full max-w-2xl"
        >
          <GlassPanel
            tone="info"
            className="flex items-center gap-3 rounded-[var(--r-xl)] px-4 py-3 sm:px-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] text-[var(--color-info)]">
              {isMaster ? <Gavel size={16} /> : <Eye size={16} />}
            </span>
            <p className="font-body text-sm leading-relaxed text-[var(--color-text)]">
              {nonVoterNotice}
            </p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Master-mode: pinned question. */}
      {isMasterMode && round.questionMain && (
        <motion.div
          variants={reduceMotion ? {} : scaleIn}
          initial="initial"
          animate="animate"
          transition={spring.gentle}
          className="mt-5 w-full max-w-2xl"
        >
          <GlassSection className="rounded-[var(--r-xl)] px-5 py-4 text-center">
            <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
              Pergunta da rodada
            </p>
            <p className="mt-2 font-display text-lg text-[var(--color-text)] md:text-xl">
              {round.questionMain}
            </p>
          </GlassSection>
        </motion.div>
      )}

      {/* Candidate cards */}
      <motion.div
        variants={reduceMotion ? {} : staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-2"
      >
        {activePlayers.map((player, index) => {
          const isSelected = selectedSuspect === player._id;
          const isMe = myPlayer._id === player._id;
          const isMyConfirmedPick = hasVoted && String(myVote?.targetId) === String(player._id);
          const candidateDisabled = !canVote || hasVoted || isMe;
          const receivedVotes = voteCountByCandidate.get(String(player._id)) ?? 0;

          // Card visual state: confirmed pick > selected > default.
          const highlighted = isMyConfirmedPick || (isSelected && !hasVoted);
          const disabledReason = isMe
            ? "Voce"
            : isMaster
              ? "Mestre observa"
              : isSpectator
                ? "Espectador"
                : hasVoted
                  ? "Voto enviado"
                  : null;

          return (
            <ReactionAnchor
              key={player._id}
              playerId={String(player._id)}
              className={getCenteredOddGridItemClass(index, activePlayers.length, "md")}
            >
              <motion.button
                type="button"
                variants={reduceMotion ? {} : staggerItem}
                transition={{ ...spring.gentle, delay: index * 0.05 }}
                onClick={() => !candidateDisabled && setSelectedSuspect(player._id)}
                disabled={candidateDisabled}
                aria-pressed={isSelected || isMyConfirmedPick}
                aria-label={`Votar em ${player.name}`}
                className={cn(
                  "relative flex min-h-[72px] w-full items-center gap-4 rounded-[var(--r-xl)] border p-4 text-left",
                  "transition-[transform,background-color,border-color,box-shadow] duration-[var(--t-quick)]",
                  "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
                  highlighted
                    ? "border-[color-mix(in_srgb,var(--color-imp)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_16%,transparent)] shadow-[var(--shadow-md)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-1)]",
                  candidateDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-imp)_30%,transparent)] hover:bg-[var(--glass-2)] active:scale-[0.96]"
                )}
              >
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  size="md"
                  hideName
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl text-[var(--color-text)]">
                    {player.name}
                  </p>
                  <p
                    className={cn(
                      "font-condensed text-[11px] uppercase tracking-[0.22em]",
                      isMyConfirmedPick
                        ? "text-[var(--color-imp)]"
                        : disabledReason
                          ? "text-[var(--text-dim)]"
                          : "text-[var(--color-text-muted)]"
                    )}
                  >
                    {isMyConfirmedPick
                      ? "Seu voto"
                      : disabledReason
                        ? disabledReason
                        : votedVoterIds.has(player._id)
                          ? "Ja votou"
                          : "Toque para selecionar"}
                  </p>
                </div>

                {/* Vote-count badge (votes received) — pops on change. */}
                <AnimatePresence>
                  {receivedVotes > 0 && (
                    <motion.span
                      key={receivedVotes}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                      className={cn(
                        "tnum flex h-7 min-w-[28px] items-center justify-center rounded-[var(--r-pill)] border px-2 font-condensed text-sm font-semibold",
                        highlighted
                          ? "border-[color-mix(in_srgb,var(--color-imp)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_22%,transparent)] text-[var(--color-imp)]"
                          : "border-[var(--w-12)] bg-[var(--w-08)] text-[var(--color-text)]"
                      )}
                      aria-label={`${receivedVotes} voto(s)`}
                    >
                      {receivedVotes}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Selected / confirmed checkmark. */}
                {(isSelected || isMyConfirmedPick) && (
                  <motion.span
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-imp)] text-white"
                  >
                    <Check size={15} strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            </ReactionAnchor>
          );
        })}
      </motion.div>

      {/* Master-mode answer reference grid. */}
      {isMasterMode && answers && answers.length > 0 && (
        <motion.div
          variants={reduceMotion ? {} : fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ ...spring.gentle, delay: 0.1 }}
          className="mt-8 w-full"
        >
          <p className="mb-3 text-center font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
            Respostas para consulta
          </p>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {answers.map((answer, index) => {
              const answerPlayer = players.find((p) => p._id === answer.playerId);
              if (!answerPlayer) return null;
              const isMarkedByMaster =
                myRole?.role === "master" && myRole.masterImpostorIds?.includes(answerPlayer._id);
              return (
                <GlassSection
                  key={answer._id}
                  className={cn(
                    "rounded-[var(--r-lg)] p-4 text-center",
                    getCenteredOddGridItemClass(index, answers.length, "md")
                  )}
                >
                  <p className="mb-1 flex items-center justify-center gap-1 font-hand text-sm text-[var(--color-text-muted)]">
                    [{answerPlayer.name}]
                    {isMarkedByMaster && (
                      <span className="text-xs font-bold text-[var(--color-imp)]" title="Impostor">
                        ?
                      </span>
                    )}
                  </p>
                  <p className="break-words font-body text-base text-[var(--color-text)]">
                    &quot;{answer.text}&quot;
                  </p>
                </GlassSection>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Action / status footer. */}
      <div className="mx-auto mt-8 w-full max-w-md">
        {canVote && !hasVoted ? (
          <Button
            className={cn(
              "h-[52px] w-full rounded-[var(--r-md)] border text-[15px] font-semibold transition-[transform,background-color] duration-[var(--t-quick)]",
              selectedSuspect
                ? "border-[color-mix(in_srgb,var(--color-imp)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_18%,transparent)] text-[var(--color-imp)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--color-imp)_26%,transparent)]"
                : "border-[var(--w-08)] bg-[var(--glass-1)] text-[var(--text-dim)]"
            )}
            disabled={!selectedSuspect}
            onClick={() => void handleVote()}
          >
            {selectedSuspect ? (
              <>
                <Gavel size={16} />
                Confirmar voto
              </>
            ) : (
              <>
                <HelpCircle size={16} />
                Selecione um suspeito
              </>
            )}
          </Button>
        ) : (
          <GlassSection
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--r-md)] border px-4 py-3 text-center",
              hasVoted &&
                "border-[color-mix(in_srgb,var(--color-safe)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
            )}
          >
            {hasVoted ? (
              <>
                <Check size={16} className="text-[var(--color-safe)]" />
                <span className="font-display text-sm uppercase tracking-widest text-[var(--color-safe)]">
                  Voto registrado
                </span>
              </>
            ) : (
              <span className="font-body text-sm text-[var(--color-text-muted)]">
                {isMaster
                  ? "Aguardando os jogadores votarem."
                  : "Aguardando o restante da sala."}
              </span>
            )}
          </GlassSection>
        )}

        {hasVoted && canVote && (
          <p className="mt-2 text-center font-body text-sm text-[var(--color-text-muted)]">
            Aguarde o restante da sala finalizar a votacao.
          </p>
        )}
      </div>
    </div>
  );
}

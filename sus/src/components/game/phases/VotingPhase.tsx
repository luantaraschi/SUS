"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Eye, Gavel, HelpCircle } from "lucide-react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getCenteredOddGridItemClass } from "@/lib/utils";
import { GlassPanel, GlassSection } from "../ui/glass";
import { fadeInUp, spring } from "@/lib/motion";
import { Burst } from "@/components/ui/Burst";
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

// Tribunal-local entrance choreography: zones cascade in from the bar down to
// the arena, each settling with a gentle spring so the screen "assembles".
const tribunalContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const tribunalZone = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
};

export function VotingPhase({ round, players, myPlayer, myRole, room, sessionId }: VotingPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [selectedSuspect, setSelectedSuspect] = useState<Id<"players"> | null>(null);
  // Transient signature state: the gavel swing + rose flash window after commit.
  const [committing, setCommitting] = useState(false);
  // Head-shake feedback when a disabled/self card is tapped.
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
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

  const votesCast = votes?.length ?? 0;
  const allIn = totalVoters > 0 && votesCast >= totalVoters;

  // Pressure-meter completion → one celebratory burst when the table is full.
  const [burstKey, setBurstKey] = useState(0);
  const prevAllInRef = useRef(false);
  useEffect(() => {
    if (allIn && !prevAllInRef.current) {
      // Schedule outside synchronous effect body to satisfy React Compiler rules.
      window.setTimeout(() => setBurstKey((k) => k + 1), 0);
    }
    prevAllInRef.current = allIn;
  }, [allIn]);

  const handleVote = async () => {
    if (!selectedSuspect || hasVoted || !canVote) return;
    // SIGNATURE: arm the gavel swing + rose flash; the swing peaks ~110ms in so
    // it reads as synced to the vote.cast tone fired right after the mutation.
    if (!reduceMotion) setCommitting(true);

    await submitVote({
      roundId: round._id,
      voterId: myPlayer._id,
      sessionId,
      suspectId: selectedSuspect,
    });
    playSound("vote.cast");

    if (!reduceMotion) {
      window.setTimeout(() => setCommitting(false), 420);
    }
  };

  const handleDisabledTap = (id: string) => {
    if (reduceMotion) return;
    setShakeCardId(id);
    window.setTimeout(() => setShakeCardId((cur) => (cur === id ? null : cur)), 420);
  };

  // Upfront, before-the-action notice for non-voters.
  const nonVoterNotice = isMaster
    ? "Mestre nao vota nesta rodada — voce observa e consulta as respostas."
    : isSpectator
      ? "Voce esta como espectador — acompanhe a votacao sem votar."
      : null;

  const armed = Boolean(selectedSuspect) && canVote && !hasVoted;

  return (
    <motion.div
      variants={reduceMotion ? undefined : tribunalContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-7"
    >
      {/* ZONE 1 — Tribunal bar: phase + live pressure meter. */}
      <motion.div variants={reduceMotion ? undefined : tribunalZone} className="w-full">
        <GlassSection className="flex flex-col gap-3 rounded-[var(--r-xl)] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PhaseIndicator
              currentPhase="voting"
              mode={round.mode}
              questionMode={room?.questionMode}
            />
            {!isMasterMode && (
              <div
                className={cn(
                  "tnum font-mono text-2xl font-bold tracking-wider sm:text-3xl",
                  "transition-[filter,transform] duration-[var(--t-quick)]"
                )}
              >
                <Timer endsAt={round.phaseEndsAt} />
              </div>
            )}
          </div>

          <PressureMeter
            cast={votesCast}
            total={totalVoters}
            allIn={allIn}
            burstKey={burstKey}
            reduceMotion={reduceMotion}
          />
        </GlassSection>
      </motion.div>

      {/* ZONE 2 — Oversized asymmetric headline. */}
      <motion.div variants={reduceMotion ? undefined : tribunalZone} className="mt-7 w-full">
        <p className="font-condensed text-sm uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
          Quem e o
        </p>
        <div className="relative inline-block">
          <motion.h2
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.06, rotate: -1.5 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -1.5 }}
            transition={reduceMotion ? { duration: 0.2 } : spring.pop}
            className="origin-left font-display text-6xl leading-[0.92] text-[var(--color-text)] sm:text-7xl md:text-8xl"
          >
            IMPOSTOR?
          </motion.h2>
          {/* Rose underline swipe. */}
          <motion.span
            aria-hidden
            initial={reduceMotion ? { opacity: 1, scaleX: 1 } : { scaleX: 0 }}
            animate={reduceMotion ? { opacity: 1, scaleX: 1 } : { scaleX: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            className="absolute -bottom-1 left-0 h-[5px] w-full origin-left rounded-[var(--r-pill)] bg-[var(--color-imp)]"
          />
        </div>
        <p className="mt-3 font-body text-sm text-[var(--color-text-muted)] sm:text-base">
          {canVote
            ? "Levante a mao para acusar — depois bata o martelo para confirmar."
            : "Acompanhe o julgamento da mesa."}
        </p>
      </motion.div>

      {/* Upfront non-voter banner — shown BEFORE the cards. */}
      {nonVoterNotice && (
        <motion.div
          variants={reduceMotion ? undefined : tribunalZone}
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
          variants={reduceMotion ? undefined : tribunalZone}
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

      {/* ZONE 3 — Suspect arena: tighter 2-col grid of taller accusation cards. */}
      <motion.div
        variants={reduceMotion ? undefined : tribunalZone}
        className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {activePlayers.map((player, index) => {
          const idStr = String(player._id);
          const isSelected = selectedSuspect === player._id;
          const isMe = myPlayer._id === player._id;
          const isMyConfirmedPick = hasVoted && String(myVote?.targetId) === idStr;
          const candidateDisabled = !canVote || hasVoted || isMe;
          const receivedVotes = voteCountByCandidate.get(idStr) ?? 0;

          // Card visual state: confirmed pick > selected > default.
          const highlighted = isMyConfirmedPick || (isSelected && !hasVoted);
          // When one suspect is accused, the rest recede so the arena "parts".
          const receded =
            !reduceMotion && Boolean(selectedSuspect) && !isSelected && !isMyConfirmedPick && !hasVoted;
          const isShaking = shakeCardId === idStr;

          const disabledReason = isMe
            ? "Voce"
            : isMaster
              ? "Mestre observa"
              : isSpectator
                ? "Espectador"
                : hasVoted
                  ? "Voto enviado"
                  : null;

          const hasVotedHere = votedVoterIds.has(player._id);
          const statusText = isMyConfirmedPick
            ? "Voto registrado"
            : disabledReason
              ? disabledReason
              : hasVotedHere
                ? "Ja votou"
                : "Toque para acusar";

          return (
            <ReactionAnchor
              key={player._id}
              playerId={idStr}
              className={getCenteredOddGridItemClass(index, activePlayers.length, "md")}
            >
              <motion.button
                type="button"
                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : isShaking
                      ? { x: [0, -5, 5, -3, 3, 0], opacity: 1, y: 0 }
                      : {
                          opacity: receded ? 0.55 : 1,
                          y: highlighted ? -4 : 0,
                          scale: highlighted ? 1.04 : receded ? 0.97 : 1,
                          rotate: highlighted ? -1 : 0,
                          filter: receded ? "blur(1.5px)" : "blur(0px)",
                        }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.18 }
                    : isShaking
                      ? { duration: 0.4 }
                      : { ...spring.gentle, delay: selectedSuspect ? 0 : index * 0.05 }
                }
                whileHover={
                  candidateDisabled || reduceMotion || receded
                    ? undefined
                    : { y: -4, scale: 1.02 }
                }
                whileTap={candidateDisabled || reduceMotion ? undefined : { scale: 0.96 }}
                onClick={() =>
                  candidateDisabled ? handleDisabledTap(idStr) : setSelectedSuspect(player._id)
                }
                aria-pressed={isSelected || isMyConfirmedPick}
                aria-disabled={candidateDisabled}
                aria-label={
                  `Acusar ${player.name}` +
                  (receivedVotes > 0 ? `, ${receivedVotes} voto${receivedVotes === 1 ? "" : "s"}` : "") +
                  (hasVotedHere ? ", ja votou" : "")
                }
                className={cn(
                  "group relative flex min-h-[150px] w-full flex-col gap-3 overflow-hidden rounded-[var(--r-xl)] border p-4 text-left",
                  "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
                  highlighted
                    ? "border-[color-mix(in_srgb,var(--color-imp)_60%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_16%,transparent)] shadow-[var(--shadow-md)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-1)]",
                  candidateDisabled && !isMyConfirmedPick
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                )}
              >
                {/* Rose radial tap-pulse (press feedback). */}
                {!reduceMotion && !candidateDisabled && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[var(--r-xl)] opacity-0 transition-opacity duration-[var(--t-quick)] group-active:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at center, color-mix(in srgb, var(--color-imp) 28%, transparent) 0%, transparent 60%)",
                    }}
                  />
                )}

                {/* Top row — enlarged avatar with a tilt on hover. */}
                <div className="flex items-start gap-3">
                  <motion.div
                    whileHover={
                      candidateDisabled || reduceMotion || receded ? undefined : { rotate: -5, scale: 1.05 }
                    }
                    transition={spring.gentle}
                    className="shrink-0"
                  >
                    <PlayerAvatar
                      name={player.name}
                      avatarSeed={player.emoji}
                      imageUrl={player.avatarImageUrl}
                      size="md"
                      hideName
                    />
                  </motion.div>

                  <div className="mt-1 min-w-0 flex-1">
                    <p className="truncate font-display text-2xl leading-tight text-[var(--color-text)]">
                      {player.name}
                    </p>
                  </div>

                  {/* Vote-count badge (votes received) — keyed pop + nudge shake. */}
                  <AnimatePresence>
                    {receivedVotes > 0 && (
                      <motion.span
                        key={receivedVotes}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 4 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                        className={cn(
                          "tnum flex h-7 min-w-[28px] items-center justify-center rounded-[var(--r-pill)] border px-2 font-condensed text-sm font-semibold",
                          highlighted
                            ? "border-[color-mix(in_srgb,var(--color-imp)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_22%,transparent)] text-[var(--color-imp)]"
                            : "border-[var(--w-12)] bg-[var(--w-08)] text-[var(--color-text)]"
                        )}
                        aria-hidden
                      >
                        {receivedVotes}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom status strip. */}
                <div className="mt-auto flex items-center gap-2">
                  {/* "Ja votou" mint dot. */}
                  <AnimatePresence>
                    {hasVotedHere && !isMyConfirmedPick && (
                      <motion.span
                        key="mintdot"
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                        className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-safe)]"
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.span
                      key={statusText}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "font-condensed text-[11px] uppercase tracking-[0.22em] transition-colors duration-[var(--t-quick)]",
                        isMyConfirmedPick
                          ? "text-[var(--color-imp)]"
                          : disabledReason
                            ? cn("text-[var(--text-dim)]", isShaking && "text-[var(--color-text-muted)]")
                            : hasVotedHere
                              ? "text-[var(--color-safe)]"
                              : highlighted
                                ? "text-[var(--color-imp)]"
                                : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                      )}
                    >
                      {statusText}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Corner accusation-mark — draws in on select / confirm. */}
                <AnimatePresence>
                  {(isSelected || isMyConfirmedPick) && (
                    <motion.span
                      key="mark"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -12 }}
                      animate={
                        isMyConfirmedPick && !reduceMotion
                          ? { opacity: 1, scale: [1.18, 1], rotate: 0 }
                          : { opacity: 1, scale: 1, rotate: 0 }
                      }
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                      className="absolute right-3 top-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-imp)] text-white shadow-[var(--shadow-sm)]"
                    >
                      <Check size={15} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Locked rose ring on the confirmed accused. */}
                {isMyConfirmedPick && (
                  <motion.span
                    aria-hidden
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                    className="pointer-events-none absolute inset-0 rounded-[var(--r-xl)] ring-2 ring-[var(--color-imp)] ring-offset-0"
                  />
                )}
              </motion.button>
            </ReactionAnchor>
          );
        })}
      </motion.div>

      {/* Master-mode answer reference grid. */}
      {isMasterMode && answers && answers.length > 0 && (
        <motion.div
          variants={reduceMotion ? undefined : fadeInUp}
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

      {/* ZONE 4 — Gavel bar (the heaviest element once a suspect is armed). */}
      <motion.div
        variants={reduceMotion ? undefined : tribunalZone}
        className="mx-auto mt-8 w-full max-w-md"
      >
        {canVote && !hasVoted ? (
          <GavelBar
            armed={armed}
            committing={committing}
            reduceMotion={reduceMotion}
            onCommit={() => void handleVote()}
          />
        ) : (
          <motion.div
            // Morph beat: pops in as the gavel bar gives way, with a mint ring
            // ripple that expands once and fades.
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0.18 } : spring.pop}
            className="relative"
          >
            <GlassSection
              className={cn(
                "relative flex items-center justify-center gap-2 overflow-hidden rounded-[var(--r-md)] border px-4 py-3 text-center",
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

            {/* Mint ring ripple — one-shot on confirm. */}
            {hasVoted && !reduceMotion && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0.7, scale: 0.92 }}
                animate={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-0 rounded-[var(--r-md)] ring-2 ring-[var(--color-safe)]"
              />
            )}
          </motion.div>
        )}

        {hasVoted && canVote && (
          <p className="mt-2 text-center font-body text-sm text-[var(--color-text-muted)]">
            Aguarde o restante da sala finalizar a votacao.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Pressure meter -------------------------------------------------------
// One segment per voter; fills imp-rose left→right as votes land. tnum "X/Y"
// rolls above; at X===Y a gold shimmer sweep + Burst celebrates the full table.
function PressureMeter({
  cast,
  total,
  allIn,
  burstKey,
  reduceMotion,
}: {
  cast: number;
  total: number;
  allIn: boolean;
  burstKey: number;
  reduceMotion: boolean;
}) {
  const segments = Math.max(total, 1);
  return (
    <div className="relative w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          Pressao da mesa
        </span>
        <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={cast}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              transition={reduceMotion ? { duration: 0.12 } : spring.pop}
              className="tnum inline-block text-[var(--color-text)]"
            >
              {cast}
            </motion.span>
          </AnimatePresence>
          /<span className="tnum">{total}</span> votos
        </span>
      </div>

      <div className="relative flex w-full gap-1 overflow-hidden rounded-[var(--r-pill)]">
        {Array.from({ length: segments }).map((_, i) => {
          const filled = i < cast;
          return (
            <div
              key={i}
              className="relative h-2.5 flex-1 overflow-hidden rounded-[var(--r-pill)] bg-[var(--w-08)]"
            >
              <motion.span
                aria-hidden
                initial={false}
                animate={{ scaleX: filled ? 1 : 0 }}
                transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                className="absolute inset-0 origin-left rounded-[var(--r-pill)] bg-[var(--color-imp)]"
                style={
                  filled
                    ? { boxShadow: "0 0 10px color-mix(in srgb, var(--color-imp) 60%, transparent)" }
                    : undefined
                }
              />
            </div>
          );
        })}

        {/* Gold shimmer sweep when the table is full. */}
        {allIn && !reduceMotion && (
          <motion.span
            key={`shimmer-${burstKey}`}
            aria-hidden
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-gold) 70%, transparent), transparent)",
            }}
          />
        )}
      </div>

      <Burst
        fire={burstKey}
        colors={["var(--color-gold)", "var(--color-imp)", "var(--color-safe)"]}
        count={16}
      />
    </div>
  );
}

// --- Gavel bar ------------------------------------------------------------
// Idle: recessed. Armed: rose tint + lift + breathing pulse + gavel wiggle.
// Commit (SIGNATURE): press 0.96 → gavel swings down synced to vote.cast →
// rose flash. (The morph to mint + ring ripple happens once hasVoted flips and
// the parent swaps this bar for the mint "Voto registrado" panel.)
function GavelBar({
  armed,
  committing,
  reduceMotion,
  onCommit,
}: {
  armed: boolean;
  committing: boolean;
  reduceMotion: boolean;
  onCommit: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={!armed}
      onClick={onCommit}
      aria-label={armed ? "Bater o martelo e confirmar o voto" : "Selecione um suspeito para confirmar"}
      initial={false}
      animate={
        reduceMotion
          ? {}
          : committing
            ? { scale: 0.96, y: 0 }
            : armed
              ? { y: [-3, -5, -3], scale: 1 }
              : { y: 0, scale: 1 }
      }
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : committing
            ? spring.press
            : armed
              ? { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }
              : spring.gentle
      }
      whileTap={armed && !reduceMotion ? { scale: 0.96 } : undefined}
      className={cn(
        "relative flex h-[60px] w-full items-center justify-center gap-3 overflow-hidden rounded-[var(--r-lg)] border text-[15px] font-semibold uppercase tracking-widest",
        "font-display focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
        armed
          ? "cursor-pointer border-[color-mix(in_srgb,var(--color-imp)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_20%,transparent)] text-[var(--color-imp)] shadow-[var(--shadow-md)]"
          : "cursor-not-allowed border-[var(--w-08)] bg-[var(--glass-1)] text-[var(--text-dim)]"
      )}
    >
      {/* Rose flash on commit. */}
      {committing && !reduceMotion && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-[var(--r-lg)] bg-[var(--color-imp)]"
        />
      )}

      {/* Gavel icon — anticipatory wiggle when armed, swing down on commit. */}
      <motion.span
        className="relative z-10 inline-flex"
        animate={
          reduceMotion
            ? {}
            : committing
              ? { rotate: [0, -22, 0] }
              : armed
                ? { rotate: [0, -8, 0] }
                : { rotate: 0 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : committing
              ? { duration: 0.22, ease: "easeInOut" }
              : armed
                ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
        }
        style={{ transformOrigin: "70% 70%" }}
      >
        {armed ? <Gavel size={18} /> : <HelpCircle size={18} />}
      </motion.span>

      <span className="relative z-10">{armed ? "Bater o martelo" : "Selecione um suspeito"}</span>
    </motion.button>
  );
}

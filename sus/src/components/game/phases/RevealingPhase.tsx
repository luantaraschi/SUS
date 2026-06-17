"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { cn, getCenteredOddGridItemClass } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../ui/glass";
import { spring } from "@/lib/motion";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { Eye, Sparkles } from "lucide-react";

interface RevealingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

/**
 * Single answer card — "the answer drops onto the table".
 *
 * Each card CASCADES in (staggerItem) with a confident overshoot, like a card
 * flipped/slapped face-up onto the table. As it lands it fires a one-shot
 * "impact" highlight ring (synced to the spring settle) so the eye is drawn to
 * the freshly-revealed answer. The impostor-question answer is marked subtly,
 * exactly where the master design already marks it — nothing is leaked here.
 */
function AnswerCard({
  player,
  answerText,
  isMarkedByMaster,
  index,
  total,
  reduceMotion,
}: {
  player: PublicPlayer;
  answerText: string;
  isMarkedByMaster: boolean;
  index: number;
  total: number;
  reduceMotion: boolean;
}) {
  // Stagger cadence — each card lands a beat after the last, like dealt cards.
  const delay = index * 0.11;
  // Two-digit table-card index, e.g. 01 / 04.
  const ordinal = String(index + 1).padStart(2, "0");
  const count = String(total).padStart(2, "0");

  return (
    <motion.div
      className="relative h-full"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 26, scale: 0.92, rotate: index % 2 === 0 ? -1.4 : 1.4 }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1, rotate: 0 }
      }
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : { type: "spring", stiffness: 360, damping: 19, delay }
      }
      style={{ willChange: "transform" }}
    >
      {/* Landing impact ring — one-shot pulse synced to the card settling, so
          each answer reads as "slapped down" onto the table. */}
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[var(--r-2xl)]"
          style={{
            boxShadow: isMarkedByMaster
              ? "0 0 0 2px color-mix(in srgb, var(--color-imp) 55%, transparent)"
              : "0 0 0 2px color-mix(in srgb, var(--color-info) 50%, transparent)",
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.98, 1.02, 1.04] }}
          transition={{ duration: 0.55, delay: delay + 0.14, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <GlassPanel
        tone={isMarkedByMaster ? "impostor" : "neutral"}
        className={cn(
          "h-full rounded-[var(--r-2xl)] p-5 sm:p-6",
          isMarkedByMaster && "border-rose-300/16"
        )}
      >
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Avatar gets a tiny "drop-in" pop just behind the card landing. */}
              <motion.div
                initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : { ...spring.pop, delay: delay + 0.06 }
                }
              >
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  size="sm"
                  hideName
                />
              </motion.div>
              <div>
                <p className="font-body text-base text-[var(--color-text)]">{player.name}</p>
                <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                  Resposta compartilhada
                </p>
              </div>
            </div>

            {isMarkedByMaster ? (
              <motion.span
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.2, delay: delay + 0.12 }
                    : { ...spring.pop, delay: delay + 0.18 }
                }
                className="shrink-0 rounded-[var(--r-pill)] border border-rose-300/18 bg-rose-300/12 px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.22em] text-rose-50"
              >
                Marcado pelo mestre
              </motion.span>
            ) : (
              // Table-card index chip — reinforces the "dealt onto the table" read.
              <span className="tnum shrink-0 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-2.5 py-1 font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {ordinal}/{count}
              </span>
            )}
          </div>

          <GlassSection className="mt-auto rounded-[var(--r-xl)] px-4 py-5 sm:px-5">
            <p className="break-words font-body text-lg font-medium leading-relaxed text-[var(--color-text)] sm:text-xl">
              &quot;{answerText}&quot;
            </p>
          </GlassSection>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

export function RevealingPhase({
  round,
  players,
  myRole,
}: RevealingPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [now, setNow] = useState(() => Date.now());
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const countdownRemaining = useMemo(() => {
    if (!round.revealedAt) return 0;
    return Math.max(0, 3 - Math.floor((now - round.revealedAt) / 1000));
  }, [now, round.revealedAt]);

  const showAnswers = countdownRemaining === 0;

  // Tension ramps as the drumroll nears zero (1 = first tick, → tighter at 0).
  // Drives ring squeeze, glow warmth, and the final-beat anticipation shake.
  const tension = (3 - countdownRemaining) / 3; // 0 → ~0.67 across 3..1
  const isFinalBeat = countdownRemaining === 1;

  // ── Synchronized countdown screen (the drumroll) ─────────────────────────
  if (!showAnswers) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-7" />

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl"
        >
          <GlassPanel tone="special" className="rounded-[var(--r-2xl)] px-6 py-8 text-center sm:px-8">
            <div className="relative z-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] shadow-[var(--shadow-md)]">
                <motion.span
                  className="inline-flex"
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: [1, 1.12, 1], rotate: [0, 8, -6, 0] }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  <Sparkles size={28} className="text-[var(--color-special)]" />
                </motion.span>
              </div>
              <p className="mt-5 font-condensed text-[11px] uppercase tracking-[0.34em] text-[var(--text-dim)]">
                Revelação sincronizada
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
                Respostas prestes a aparecer
              </h2>
              <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Em instantes todo mundo verá a mesma grade. Observe o ritmo, as escolhas e quem parece estar improvisando.
              </p>

              {/* Drumroll ring — squeezes + warms as it nears zero. */}
              <div className="mt-8 flex justify-center">
                <motion.div
                  className="relative flex h-44 w-44 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-1)] shadow-[var(--shadow-lg)]"
                  // The whole ring tightens slightly with each beat (more tension
                  // close to zero), and gives one anticipatory jolt on the final beat.
                  animate={
                    reduceMotion
                      ? undefined
                      : isFinalBeat
                        ? { scale: [1, 1.05, 0.99, 1.02], x: [0, -2, 2, -1, 0] }
                        : { scale: 1 - tension * 0.04 }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : isFinalBeat
                        ? { duration: 0.55, ease: "easeInOut" }
                        : spring.gentle
                  }
                >
                  {/* Breathing inner glow — beats faster as tension rises. */}
                  <motion.div
                    aria-hidden
                    className="absolute inset-4 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in srgb, var(--color-special) 30%, rgba(255,255,255,0.22)), transparent 68%)",
                    }}
                    animate={
                      reduceMotion ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.94, 1, 0.94] }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : { duration: Math.max(0.7, 1.6 - tension), repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                  <div className="absolute inset-0 rounded-full border border-[var(--w-10)]" />

                  {/* Per-tick expanding pulse ring — the "drum hit". Keyed to the
                      number so a fresh ring fires on every count. */}
                  {!reduceMotion && (
                    <motion.span
                      key={`pulse-${countdownRemaining}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        border: "2px solid color-mix(in srgb, var(--color-special) 60%, transparent)",
                      }}
                      initial={{ opacity: 0.7, scale: 0.82 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}

                  {/* The confident counting number — spring pop on each beat. */}
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countdownRemaining}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.55, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.5, y: 6 }}
                      transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                      className="tnum relative font-display text-[5rem] leading-none text-[var(--color-text)]"
                      style={{
                        // Glow warms toward the impostor/special palette near zero.
                        filter: `drop-shadow(0 0 ${18 + tension * 26}px color-mix(in srgb, var(--color-special) ${Math.round(
                          24 + tension * 46
                        )}%, rgba(255,255,255,0.5)))`,
                      }}
                    >
                      {countdownRemaining}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Drumroll tick dots — fill toward the reveal for clear pacing. */}
              <div className="mt-7 flex items-center justify-center gap-2">
                {[3, 2, 1].map((tick) => {
                  const active = countdownRemaining <= tick;
                  return (
                    <motion.span
                      key={tick}
                      aria-hidden
                      animate={{ scale: active ? 1 : 0.7 }}
                      transition={reduceMotion ? { duration: 0 } : spring.pop}
                      className={cn(
                        "h-2 w-2 rounded-[var(--r-pill)]",
                        active ? "bg-[var(--color-special)]" : "bg-[var(--w-16)]"
                      )}
                      style={
                        active
                          ? { boxShadow: "0 0 10px color-mix(in srgb, var(--color-special) 60%, transparent)" }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  // ── Answer reveal grid (the answers drop / cascade onto the table) ───────
  const total = answers?.length ?? 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center px-4 py-8 sm:py-10">
      <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-6" />

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <GlassPanel tone="info" className="rounded-[var(--r-2xl)] px-5 py-5 sm:px-6">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                <Eye size={14} />
                Quadro aberto
              </div>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
                Respostas reveladas
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                A discussão começa automaticamente quando esse tempo acabar. Compare padrão, vocabulário e segurança de cada resposta.
              </p>
            </div>

            <GlassSection className="rounded-[var(--r-xl)] px-4 py-3 text-center lg:min-w-[240px]">
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Tempo restante
              </p>
              <Timer endsAt={round.phaseEndsAt} className="mt-3 justify-center" />
            </GlassSection>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Answer cards cascade onto the table. */}
      <div className="mt-6 grid w-full grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {answers?.map((answer, index) => {
          const player = players.find((p) => p._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);

          return (
            <ReactionAnchor
              key={answer._id}
              playerId={String(player._id)}
              className={getCenteredOddGridItemClass(index, total, "lg")}
            >
              <AnswerCard
                player={player}
                answerText={answer.text}
                isMarkedByMaster={!!isMarkedByMaster}
                index={index}
                total={total}
                reduceMotion={reduceMotion}
              />
            </ReactionAnchor>
          );
        })}
      </div>
    </div>
  );
}

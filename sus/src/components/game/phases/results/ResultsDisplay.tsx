"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ShieldAlert, ShieldCheck, Vote, X } from "lucide-react";
import { cn, getCenteredOddGridItemClass } from "@/lib/utils";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import PlayerAvatar from "../../PlayerAvatar";
import { ReactionAnchor } from "../../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../../ui/glass";
import { slamIn, spring } from "@/lib/motion";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";

interface ResultsDisplayProps {
  round: SafeRound;
  players: PublicPlayer[];
  realImpostors: PublicPlayer[];
  votedOut: PublicPlayer | null;
  groupWon: boolean;
  outcomeSummary: string;
  votes: Doc<"votes">[] | undefined;
}

export function ResultsDisplay({
  round,
  players,
  realImpostors,
  votedOut,
  groupWon,
  outcomeSummary,
  votes,
}: ResultsDisplayProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const multiple = realImpostors.length > 1;

  // Winner-coloured token used across the stage so the tint stays coherent.
  const winColor = groupWon ? "var(--color-safe)" : "var(--color-imp)";
  const winColorB = groupWon ? "var(--color-gold)" : "var(--color-special)";

  // Did the eliminated player turn out to be a real impostor?
  const votedOutWasImpostor =
    !!votedOut && realImpostors.some((imp) => imp._id === votedOut._id);

  // Stamp chips for the bottom strip of the verdict stage.
  const stamps = useMemo(() => {
    const out: { id: string; label: string; tone: "imp" | "safe" }[] = [];
    out.push({
      id: "eliminado",
      label: votedOut ? `ELIMINADO: ${votedOut.name}` : "SEM ELIMINACAO",
      tone: votedOutWasImpostor ? "safe" : "imp",
    });
    if (realImpostors.length > 0) {
      out.push({
        id: "impostor",
        label: `${multiple ? "IMPOSTORES" : "IMPOSTOR"}: ${realImpostors
          .map((p) => p.name)
          .join(", ")}`,
        tone: "imp",
      });
    }
    return out;
  }, [votedOut, votedOutWasImpostor, realImpostors, multiple]);

  return (
    <div className="flex flex-col gap-6">
      {/* ============================================================= */}
      {/* (A) VERDICT STAGE — full-bleed, loud, tinted by the winner.   */}
      {/* ============================================================= */}
      <GlassPanel
        tone={groupWon ? "safe" : "impostor"}
        className="relative overflow-hidden rounded-[var(--r-2xl)] px-5 py-8 sm:px-10 sm:py-10"
        style={
          {
            minHeight: "min(64dvh, 640px)",
            ["--rv-win" as string]: winColor,
            ["--rv-win-b" as string]: winColorB,
          } as CSSProperties
        }
      >
        {/* Winner-tinted radial wash so the whole stage glows. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(120% 90% at 18% 8%, color-mix(in srgb, var(--rv-win) 22%, transparent) 0%, transparent 60%)",
          }}
        />

        {/* Oversized crest watermark bleeding off the top-right corner. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 z-0 sm:-right-10 sm:-top-24"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -8 }}
          animate={
            reduceMotion
              ? { opacity: 0.1 }
              : {
                  opacity: 0.12,
                  scale: [1, 1.04, 1],
                  rotate: [0, -2, 0],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.4 }
              : {
                  opacity: { duration: 0.5 },
                  scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                }
          }
          style={{ color: "var(--rv-win)" }}
        >
          {groupWon ? (
            <ShieldCheck className="h-[clamp(16rem,42vw,30rem)] w-[clamp(16rem,42vw,30rem)]" strokeWidth={1} />
          ) : (
            <ShieldAlert className="h-[clamp(16rem,42vw,30rem)] w-[clamp(16rem,42vw,30rem)]" strokeWidth={1} />
          )}
        </motion.div>

        <div className="relative z-10 flex min-h-[inherit] flex-col">
          {/* Kicker */}
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-[var(--r-pill)] border px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.32em]"
            )}
            style={{
              borderColor: "color-mix(in srgb, var(--rv-win) 32%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--rv-win) 12%, transparent)",
              color: "var(--rv-win)",
            }}
          >
            {groupWon ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            Veredito oficial
          </motion.div>

          {/* The slam-in headline — cursive, bleeding large. */}
          <div className="my-auto py-8">
            <motion.h1
              variants={reduceMotion ? undefined : slamIn}
              initial={reduceMotion ? { opacity: 0 } : "initial"}
              animate={reduceMotion ? { opacity: 1 } : "animate"}
              transition={reduceMotion ? { delay: 0.12, duration: 0.3 } : { delay: 0.12 }}
              className="font-display leading-[0.92] text-[var(--color-text)]"
              style={{
                fontSize: "clamp(3rem, 10vw, 6.5rem)",
                textShadow:
                  "0 0 48px color-mix(in srgb, var(--rv-win) 42%, transparent), 0 0 14px color-mix(in srgb, var(--rv-win-b) 24%, transparent)",
              }}
            >
              {groupWon ? "Vitoria do grupo" : "Vitoria do impostor"}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-2xl font-body text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg"
            >
              {outcomeSummary}
            </motion.p>
          </div>

          {/* Bottom STAMP strip — rotated rubber-stamp chips. */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={
              reduceMotion ? undefined : { animate: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }
            }
            className="mt-auto flex flex-wrap items-center gap-3 pt-2"
          >
            {stamps.map((stamp, i) => (
              <motion.div
                key={stamp.id}
                variants={
                  reduceMotion
                    ? undefined
                    : {
                        initial: { opacity: 0, scale: 1.4, rotate: i % 2 === 0 ? -5 : 4 },
                        animate: {
                          opacity: 1,
                          scale: 1,
                          rotate: i % 2 === 0 ? -3 : 2,
                          transition: spring.pop,
                        },
                      }
                }
                className="inline-flex items-center gap-2 rounded-[var(--r-sm)] border-2 px-4 py-2 font-condensed text-[12px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  borderColor:
                    stamp.tone === "safe"
                      ? "color-mix(in srgb, var(--color-safe) 55%, transparent)"
                      : "color-mix(in srgb, var(--color-imp) 55%, transparent)",
                  color:
                    stamp.tone === "safe" ? "var(--color-safe)" : "var(--color-imp)",
                  backgroundColor:
                    stamp.tone === "safe"
                      ? "color-mix(in srgb, var(--color-safe) 10%, transparent)"
                      : "color-mix(in srgb, var(--color-imp) 10%, transparent)",
                  boxShadow:
                    "inset 0 0 0 1px color-mix(in srgb, var(--color-text) 8%, transparent)",
                }}
              >
                {stamp.label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </GlassPanel>

      {/* ============================================================= */}
      {/* (B) UNMASKING band — the masks come off, cards flip face-up.  */}
      {/* ============================================================= */}
      <GlassPanel
        tone="impostor"
        className="relative overflow-hidden rounded-[var(--r-xl)] px-5 py-8 sm:px-6"
      >
        {/* Imp-tinted spotlight radial. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(70% 80% at 50% 0%, color-mix(in srgb, var(--color-imp) 22%, transparent) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10">
          {/* Gold divider + centered kicker. */}
          <div className="flex flex-col items-center text-center">
            <div className="flex w-full max-w-xs items-center gap-3">
              <span
                className="h-px flex-1"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-gold) 60%, transparent))",
                }}
              />
              <span className="font-condensed text-[11px] uppercase tracking-[0.4em] text-[var(--color-gold)]">
                A mascara cai
              </span>
              <span
                className="h-px flex-1"
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 60%, transparent), transparent)",
                }}
              />
            </div>
            <h2 className="mt-4 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
              {multiple ? "Os impostores eram" : "O impostor era"}
            </h2>
          </div>

          {/* Centered cluster of flipping impostor cards. */}
          <div
            className={cn(
              "mt-8 grid justify-items-center gap-5",
              realImpostors.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"
            )}
            style={{ perspective: "1200px" }}
          >
            {realImpostors.map((impostor, index) => {
              const cleared = !!votedOut && votedOut._id === impostor._id;
              return (
                <ReactionAnchor
                  key={impostor._id}
                  playerId={String(impostor._id)}
                  className={cn(
                    "w-full max-w-[280px]",
                    getCenteredOddGridItemClass(index, realImpostors.length, "sm")
                  )}
                >
                  <motion.div
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, rotateY: 90, scale: 0.92 }
                    }
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, rotateY: 0, scale: 1 }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0.25, delay: index * 0.08 }
                        : { ...spring.gentle, delay: 0.2 + index * 0.1 }
                    }
                    style={{ transformStyle: "preserve-3d" }}
                    className="h-full"
                  >
                    <GlassSection className="relative h-full rounded-[var(--r-lg)] border-[color-mix(in_srgb,var(--color-imp)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_12%,transparent)] p-5 text-center shadow-[var(--shadow-md)]">
                      {/* Verdict stamp on the eliminated impostor / non-impostor. */}
                      {cleared && (
                        <motion.div
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.5, rotate: -16 }}
                          animate={
                            reduceMotion
                              ? { opacity: 1 }
                              : { opacity: 1, scale: 1, rotate: -12 }
                          }
                          transition={
                            reduceMotion
                              ? { duration: 0.2, delay: 0.4 + index * 0.1 }
                              : { ...spring.pop, delay: 0.5 + index * 0.1 }
                          }
                          className="absolute -right-2 -top-2 z-20 flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border-2 border-[var(--color-safe)] bg-[color-mix(in_srgb,var(--color-safe)_18%,transparent)] text-[var(--color-safe)] shadow-[var(--shadow-sm)]"
                        >
                          <Check size={20} strokeWidth={3} />
                        </motion.div>
                      )}

                      <div className="flex flex-col items-center">
                        <PlayerAvatar
                          name={impostor.name}
                          avatarSeed={impostor.emoji}
                          imageUrl={impostor.avatarImageUrl}
                          size="xl"
                        />
                        <p className="mt-4 font-display text-2xl text-[var(--color-text)]">
                          {impostor.name}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-imp)]">
                          <ShieldAlert size={13} />
                          Impostor confirmado
                        </p>
                      </div>
                    </GlassSection>
                  </motion.div>
                </ReactionAnchor>
              );
            })}

            {/* Edge case: a wrong elimination earns an imp "X" shake chip. */}
            {votedOut && !votedOutWasImpostor && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 0 }}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, x: [0, -6, 6, -4, 4, 0] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.2, delay: 0.6 }
                    : { delay: 0.6, x: { duration: 0.5 }, opacity: { duration: 0.3 } }
                }
                className="col-span-full mt-1 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-imp)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_12%,transparent)] px-4 py-2 font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-imp)]"
              >
                <X size={14} strokeWidth={3} />
                {votedOut.name} nao era o impostor
              </motion.div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* ============================================================= */}
      {/* (C) EVIDENCE BENTO — 01 PROVA / 02 VOTOS (Placar lives below). */}
      {/* ============================================================= */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        {/* 01 — Round recap (content that was played). Words un-redact. */}
        <GlassPanel tone="special" className="relative overflow-hidden rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
          <div className="relative z-10">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm tabular-nums text-[color-mix(in_srgb,var(--color-special)_85%,white)]">
                01
              </span>
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Prova
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">
              Resumo da rodada
            </h2>

            <div className="mt-5 grid gap-3">
              {round.mode === "word" && round.word && (
                <UnredactSection
                  reduceMotion={reduceMotion}
                  label="Palavra da rodada"
                  labelColor="color-mix(in srgb, var(--color-safe) 75%, white)"
                >
                  <span className="font-display text-2xl text-[var(--color-text)]">
                    {round.word}
                  </span>
                </UnredactSection>
              )}

              {round.mode === "question" && round.questionMain && (
                <UnredactSection
                  reduceMotion={reduceMotion}
                  label="Pergunta normal"
                  labelColor="color-mix(in srgb, var(--color-safe) 75%, white)"
                >
                  <span className="font-body text-base leading-relaxed text-[var(--color-text)]">
                    &quot;{round.questionMain}&quot;
                  </span>
                </UnredactSection>
              )}

              {round.mode === "question" && round.questionImpostor && (
                <UnredactSection
                  reduceMotion={reduceMotion}
                  label="Pergunta do SUS"
                  labelColor="color-mix(in srgb, var(--color-imp) 75%, white)"
                >
                  <span className="font-body text-base leading-relaxed text-[var(--color-text)]">
                    &quot;{round.questionImpostor}&quot;
                  </span>
                </UnredactSection>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* 02 — Vote ledger. Rows slide in; rows on the real impostor flash. */}
        <GlassPanel tone="neutral" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
          <div className="relative z-10">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm tabular-nums text-[var(--text-dim)]">02</span>
              <div className="flex items-center gap-2">
                <Vote size={15} className="text-[var(--text-dim)]" />
                <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                  Votos
                </p>
              </div>
            </div>
            <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">Ledger</h2>

            <motion.div
              initial="initial"
              animate="animate"
              variants={
                reduceMotion ? undefined : { animate: { transition: { staggerChildren: 0.06 } } }
              }
              className="custom-scrollbar mt-4 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1"
            >
              {votes?.map((vote) => {
                const voterPlayer = players.find((p) => p._id === vote.voterId);
                const targetPlayer = players.find((p) => p._id === vote.targetId);
                if (!voterPlayer || !targetPlayer) return null;
                const targetIsImpostor = realImpostors.some(
                  (imp) => imp._id === targetPlayer._id
                );

                return (
                  <motion.div
                    key={vote._id}
                    variants={
                      reduceMotion
                        ? undefined
                        : {
                            initial: { opacity: 0, x: -12 },
                            animate: { opacity: 1, x: 0, transition: spring.gentle },
                          }
                    }
                  >
                    <motion.div
                      // Rows that fingered the real impostor flash imp once.
                      animate={
                        reduceMotion || !targetIsImpostor
                          ? undefined
                          : {
                              boxShadow: [
                                "0 0 0 0 transparent",
                                "0 0 0 2px color-mix(in srgb, var(--color-imp) 60%, transparent)",
                                "0 0 0 0 transparent",
                              ],
                            }
                      }
                      transition={
                        reduceMotion || !targetIsImpostor
                          ? undefined
                          : { duration: 0.9, delay: 0.4, ease: "easeInOut" }
                      }
                      className="rounded-[var(--r-sm)]"
                    >
                      <GlassSection className="rounded-[var(--r-sm)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="max-w-[120px] truncate font-body text-sm text-[var(--color-text-muted)]">
                            {voterPlayer.name}
                          </span>
                          <motion.span
                            initial={reduceMotion ? undefined : { opacity: 0, scaleX: 0 }}
                            animate={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
                            transition={reduceMotion ? undefined : { delay: 0.35, duration: 0.25 }}
                            style={{ originX: 0 }}
                            className="shrink-0"
                          >
                            <ArrowRight
                              size={14}
                              className={cn(
                                targetIsImpostor
                                  ? "text-[var(--color-imp)]"
                                  : "text-[var(--text-dim)]"
                              )}
                            />
                          </motion.span>
                          <span
                            className={cn(
                              "max-w-[120px] truncate text-right font-body text-sm",
                              targetIsImpostor
                                ? "text-[var(--color-imp)]"
                                : "text-[var(--color-text)]"
                            )}
                          >
                            {targetPlayer.name}
                          </span>
                        </div>
                      </GlassSection>
                    </motion.div>
                  </motion.div>
                );
              })}

              {votes && votes.length === 0 && (
                <motion.p
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-body text-sm text-[var(--text-dim)]"
                >
                  Nenhum voto foi registrado nesta rodada.
                </motion.p>
              )}
            </motion.div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

/** A redacted block that un-blurs to reveal the played content. */
function UnredactSection({
  reduceMotion,
  label,
  labelColor,
  children,
}: {
  reduceMotion: boolean;
  label: string;
  labelColor: string;
  children: ReactNode;
}) {
  return (
    <GlassSection className="rounded-[var(--r-md)] px-4 py-4">
      <p
        className="font-condensed text-[11px] uppercase tracking-[0.22em]"
        style={{ color: labelColor }}
      >
        {label}
      </p>
      <motion.div
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(6px)" }
        }
        animate={
          reduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2"
      >
        {children}
      </motion.div>
    </GlassSection>
  );
}

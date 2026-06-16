"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldAlert, ShieldCheck, Vote } from "lucide-react";
import { cn, getCenteredOddGridItemClass } from "@/lib/utils";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import PlayerAvatar from "../../PlayerAvatar";
import { ReactionAnchor } from "../../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../../ui/glass";
import { fadeInUp, scaleIn, spring, staggerContainer, staggerItem } from "@/lib/motion";
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

  return (
    <div className="flex flex-col gap-6">
      {/* Outcome banner — the verdict, tinted by who won. */}
      <GlassPanel
        tone={groupWon ? "safe" : "impostor"}
        className="rounded-[var(--r-2xl)] px-6 py-7 sm:px-8 sm:py-8"
      >
        <motion.div
          variants={reduceMotion ? undefined : fadeInUp}
          initial="initial"
          animate="animate"
          transition={spring.gentle}
          className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--r-pill)] border px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.28em]",
                groupWon
                  ? "border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)] text-[var(--color-safe)]"
                  : "border-[color-mix(in_srgb,var(--color-imp)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_12%,transparent)] text-[var(--color-imp)]"
              )}
            >
              {groupWon ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              Resultado oficial
            </div>
            <h1
              className={cn(
                "mt-4 font-display text-[clamp(2.7rem,7vw,5.2rem)] leading-none text-[var(--color-text)]",
                groupWon
                  ? "drop-shadow-[0_0_28px_color-mix(in_srgb,var(--color-safe)_28%,transparent)]"
                  : "drop-shadow-[0_0_28px_color-mix(in_srgb,var(--color-imp)_28%,transparent)]"
              )}
            >
              {groupWon ? "Vitoria do grupo" : "Vitoria do impostor"}
            </h1>
            <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              {outcomeSummary}
            </p>
          </div>

          <GlassSection className="rounded-[var(--r-lg)] px-4 py-4 lg:min-w-[260px]">
            <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              Leitura final
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  Eliminado
                </span>
                <span className="max-w-[140px] truncate font-body text-sm text-[var(--color-text)]">
                  {votedOut?.name ?? "Empate"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {multiple ? "Impostores" : "Impostor"}
                </span>
                <span className="max-w-[140px] truncate text-right font-body text-sm text-[var(--color-imp)]">
                  {realImpostors.map((player) => player.name).join(", ")}
                </span>
              </div>
            </div>
          </GlassSection>
        </motion.div>
      </GlassPanel>

      {/* Impostor reveal — the payoff. Confident spring-in, imp tone. */}
      <GlassPanel tone="impostor" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--color-imp)_80%,white)]">
                {multiple ? "Identidades reveladas" : "Identidade revelada"}
              </p>
              <h2 className="mt-2 font-display text-2xl text-[var(--color-text)] sm:text-3xl">
                {multiple ? "Os impostores eram" : "O impostor era"}
              </h2>
            </div>

            <div className="rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-imp)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_16%,transparent)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-imp)]">
              Sus
            </div>
          </div>

          <motion.div
            variants={reduceMotion ? undefined : staggerContainer}
            initial="initial"
            animate="animate"
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            {realImpostors.map((impostor, index) => (
              <ReactionAnchor
                key={impostor._id}
                playerId={String(impostor._id)}
                className={getCenteredOddGridItemClass(index, realImpostors.length, "sm")}
              >
                <motion.div
                  variants={reduceMotion ? undefined : staggerItem}
                  transition={reduceMotion ? { duration: 0.2 } : spring.pop}
                  className="h-full"
                >
                  <GlassSection className="h-full rounded-[var(--r-lg)] border-[color-mix(in_srgb,var(--color-imp)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_10%,transparent)] p-5 text-center shadow-[var(--shadow-md)]">
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
                      <p className="mt-2 font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-imp)]">
                        Impostor confirmado
                      </p>
                    </div>
                  </GlassSection>
                </motion.div>
              </ReactionAnchor>
            ))}
          </motion.div>
        </div>
      </GlassPanel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        {/* Round recap — content that was played. */}
        <GlassPanel tone="special" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
          <div className="relative z-10">
            <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              Resumo da rodada
            </p>
            <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">
              Conteudo jogado
            </h2>

            <div className="mt-5 grid gap-3">
              {round.mode === "word" && round.word && (
                <GlassSection className="rounded-[var(--r-md)] px-4 py-4">
                  <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--color-safe)_75%,white)]">
                    Palavra da rodada
                  </p>
                  <p className="mt-2 font-display text-2xl text-[var(--color-text)]">{round.word}</p>
                </GlassSection>
              )}

              {round.mode === "question" && round.questionMain && (
                <GlassSection className="rounded-[var(--r-md)] px-4 py-4">
                  <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--color-safe)_75%,white)]">
                    Pergunta normal
                  </p>
                  <p className="mt-2 font-body text-base leading-relaxed text-[var(--color-text)]">
                    &quot;{round.questionMain}&quot;
                  </p>
                </GlassSection>
              )}

              {round.mode === "question" && round.questionImpostor && (
                <GlassSection className="rounded-[var(--r-md)] px-4 py-4">
                  <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--color-imp)_75%,white)]">
                    Pergunta do SUS
                  </p>
                  <p className="mt-2 font-body text-base leading-relaxed text-[var(--color-text)]">
                    &quot;{round.questionImpostor}&quot;
                  </p>
                </GlassSection>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* Vote ledger — who voted for whom. */}
        <GlassPanel tone="neutral" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Vote size={16} className="text-[var(--text-dim)]" />
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Ledger de votos
              </p>
            </div>

            <motion.div
              variants={reduceMotion ? undefined : staggerContainer}
              initial="initial"
              animate="animate"
              className="mt-4 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar"
            >
              {votes?.map((vote) => {
                const voterPlayer = players.find((player) => player._id === vote.voterId);
                const targetPlayer = players.find((player) => player._id === vote.targetId);
                if (!voterPlayer || !targetPlayer) return null;
                const targetIsImpostor = realImpostors.some(
                  (impostor) => impostor._id === targetPlayer._id
                );

                return (
                  <motion.div
                    key={vote._id}
                    variants={reduceMotion ? undefined : staggerItem}
                    transition={reduceMotion ? { duration: 0.2 } : spring.gentle}
                  >
                    <GlassSection className="rounded-[var(--r-sm)] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="max-w-[120px] truncate font-body text-sm text-[var(--color-text-muted)]">
                          {voterPlayer.name}
                        </span>
                        <ArrowRight size={14} className="shrink-0 text-[var(--text-dim)]" />
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
                );
              })}

              {votes && votes.length === 0 && (
                <motion.p
                  variants={reduceMotion ? undefined : scaleIn}
                  initial="initial"
                  animate="animate"
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

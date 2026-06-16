"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../PlayerAvatar";
import { GlassPanel, GlassSection } from "../../ui/glass";
import { spring, staggerContainer, staggerItem } from "@/lib/motion";
import type { PublicPlayer } from "@/lib/game-view-types";

interface LeaderboardProps {
  players: PublicPlayer[];
  myPlayerId: string;
  impostorIds: string[];
}

export function Leaderboard({ players, myPlayerId, impostorIds }: LeaderboardProps) {
  const reduceMotion = useReducedMotion() ?? false;

  // Rank active players by score (desc), tie-break by name for stability.
  const ranked = useMemo(() => {
    return players
      .filter((player) => !player.isSpectator)
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));
  }, [players]);

  if (ranked.length === 0) return null;

  return (
    <GlassPanel tone="special" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-gold)]" />
          <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            Placar geral
          </p>
        </div>
        <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">Classificacao</h2>

        <motion.ol
          variants={reduceMotion ? undefined : staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-5 flex flex-col gap-2"
        >
          {ranked.map((player, index) => {
            const rank = index + 1;
            const isMe = String(player._id) === myPlayerId;
            const wasImpostor = impostorIds.includes(String(player._id));
            const isTop = rank === 1;

            return (
              <motion.li
                key={player._id}
                variants={reduceMotion ? undefined : staggerItem}
                transition={reduceMotion ? { duration: 0.2 } : spring.gentle}
              >
                <GlassSection
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5",
                    isMe &&
                      "border-[color-mix(in_srgb,var(--color-info)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)]",
                    isTop &&
                      !isMe &&
                      "border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_08%,transparent)]"
                  )}
                >
                  {/* Rank badge — tabular so digits don't shift. */}
                  <span
                    className={cn(
                      "tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-pill)] border font-condensed text-sm font-semibold",
                      isTop
                        ? "border-[color-mix(in_srgb,var(--color-gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)] text-[var(--color-gold)]"
                        : "border-[var(--w-12)] bg-[var(--w-08)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {isTop ? <Crown size={15} /> : rank}
                  </span>

                  <PlayerAvatar
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    size="sm"
                    hideName
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg leading-tight text-[var(--color-text)]">
                      {player.name}
                      {isMe && (
                        <span className="ml-2 font-condensed text-[10px] uppercase tracking-[0.22em] text-[var(--color-info)]">
                          Voce
                        </span>
                      )}
                    </p>
                    {wasImpostor && (
                      <p className="font-condensed text-[10px] uppercase tracking-[0.22em] text-[var(--color-imp)]">
                        Era impostor
                      </p>
                    )}
                  </div>

                  {/* Score — tabular-nums so it never reflows. */}
                  <div className="shrink-0 text-right">
                    <span className="tnum font-display text-xl text-[var(--color-text)]">
                      {player.score ?? 0}
                    </span>
                    <span className="ml-1 font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      pts
                    </span>
                  </div>
                </GlassSection>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </GlassPanel>
  );
}

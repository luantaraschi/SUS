"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../PlayerAvatar";
import { GlassPanel, GlassSection } from "../../ui/glass";
import { spring } from "@/lib/motion";
import type { PublicPlayer } from "@/lib/game-view-types";

interface LeaderboardProps {
  players: PublicPlayer[];
  myPlayerId: string;
  impostorIds: string[];
}

/** Score that counts up to its target, with a pop on the final settle. */
function CountUpScore({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  // popKey is incremented inside the effect's onComplete callback (not during
  // render), which remounts the motion.span and re-runs its enter animation.
  const [popKey, setPopKey] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Schedule outside synchronous effect body to satisfy React Compiler rules.
      window.setTimeout(() => setDisplay(value), 0);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
      onComplete: () => {
        if (isMountedRef.current) setPopKey((k) => k + 1);
      },
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <motion.span
      key={reduceMotion ? undefined : popKey}
      initial={reduceMotion || popKey === 0 ? undefined : { scale: 1.28 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
      className="tnum inline-block font-display text-xl text-[var(--color-text)]"
    >
      {display}
    </motion.span>
  );
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
        <div className="flex items-baseline gap-3">
          <span className="font-display text-sm tabular-nums text-[var(--text-dim)]">03</span>
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-[var(--color-gold)]" />
            <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              Placar
            </p>
          </div>
        </div>
        <h2 className="mt-2 font-display text-2xl text-[var(--color-text)]">Classificacao</h2>

        <motion.ol
          initial="initial"
          animate="animate"
          variants={reduceMotion ? undefined : { animate: { transition: { staggerChildren: 0.07 } } }}
          className="mt-5 flex flex-col gap-2"
        >
          {ranked.map((player, index) => {
            const rank = index + 1;
            const isMe = String(player._id) === myPlayerId;
            const wasImpostor = impostorIds.includes(String(player._id));
            const isTop = rank === 1;
            const score = player.score ?? 0;

            return (
              <motion.li
                key={player._id}
                variants={
                  reduceMotion
                    ? undefined
                    : {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0, transition: spring.gentle },
                      }
                }
              >
                {isTop ? (
                  /* ---- Champion: gold plinth, dropping crown, shimmer sweep, idle rock. ---- */
                  <motion.div
                    animate={
                      reduceMotion
                        ? undefined
                        : { rotate: [0, 0.5, 0, -0.5, 0] }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }
                    }
                  >
                    <GlassSection
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-[var(--r-md)] px-3 py-3.5",
                        "border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] shadow-[var(--shadow-md)]"
                      )}
                    >
                      {/* One-shot gold shimmer sweep. */}
                      {!reduceMotion && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 z-0 w-1/3"
                          style={{
                            background:
                              "linear-gradient(105deg, transparent, color-mix(in srgb, var(--color-gold) 38%, transparent), transparent)",
                          }}
                          initial={{ x: "-150%" }}
                          animate={{ x: "350%" }}
                          transition={{ delay: 0.6, duration: 1.1, ease: "easeInOut" }}
                        />
                      )}

                      {/* Crown badge with a spring drop-in. */}
                      <motion.span
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -22, rotate: -18, scale: 0.6 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
                        transition={reduceMotion ? { duration: 0.2 } : { ...spring.pop, delay: 0.45 }}
                        className="tnum relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_22%,transparent)] text-[var(--color-gold)]"
                      >
                        <Crown size={17} />
                      </motion.span>

                      <div className="relative z-10">
                        <PlayerAvatar
                          name={player.name}
                          avatarSeed={player.emoji}
                          imageUrl={player.avatarImageUrl}
                          size="sm"
                          hideName
                        />
                      </div>

                      <div className="relative z-10 min-w-0 flex-1">
                        <p className="truncate font-display text-lg leading-tight text-[var(--color-text)]">
                          {player.name}
                          {isMe && (
                            <span className="ml-2 font-condensed text-[10px] uppercase tracking-[0.22em] text-[var(--color-info)]">
                              Voce
                            </span>
                          )}
                        </p>
                        <p className="font-condensed text-[10px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
                          {wasImpostor ? "Era impostor - lider" : "Lider da mesa"}
                        </p>
                      </div>

                      <div className="relative z-10 shrink-0 text-right">
                        <CountUpScore value={score} reduceMotion={reduceMotion} />
                        <span className="ml-1 font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                          pts
                        </span>
                      </div>
                    </GlassSection>
                  </motion.div>
                ) : (
                  /* ---- Standard row. ---- */
                  <GlassSection
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5",
                      isMe &&
                        "border-[color-mix(in_srgb,var(--color-info)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)]"
                    )}
                  >
                    <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--w-12)] bg-[var(--w-08)] font-condensed text-sm font-semibold text-[var(--color-text-muted)]">
                      {rank}
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

                    <div className="shrink-0 text-right">
                      <CountUpScore value={score} reduceMotion={reduceMotion} />
                      <span className="ml-1 font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                        pts
                      </span>
                    </div>
                  </GlassSection>
                )}
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </GlassPanel>
  );
}

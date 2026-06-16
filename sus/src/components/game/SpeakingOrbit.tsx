"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { PublicPlayer } from "@/lib/game-view-types";
import PlayerAvatar from "./PlayerAvatar";
import { ReactionAnchor } from "./reactions/ReactionAnchor";

interface SpeakingOrbitProps {
  players: PublicPlayer[];
  currentSpeakerIndex: number;
  myPlayerId: Id<"players">;
  centerContent: ReactNode;
}

export default function SpeakingOrbit({
  players,
  currentSpeakerIndex,
  myPlayerId,
  centerContent,
}: SpeakingOrbitProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const totalPlayers = players.length;
  const radiusPercent =
    totalPlayers >= 11 ? 41 : totalPlayers >= 9 ? 39 : totalPlayers >= 7 ? 37 : 33;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(82vw,660px)]">
      {/* Center ring — gives the orbit a clear focal anchor (concentric radii). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[24%] rounded-[var(--r-pill)] border border-[var(--w-08)] bg-[radial-gradient(circle,var(--w-08),transparent_70%)]"
      />

      {players.map((player, index) => {
        const angle = (-90 + (360 / Math.max(totalPlayers, 1)) * index) * (Math.PI / 180);
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        const isCurrent = index === currentSpeakerIndex;
        const isMe = player._id === myPlayerId;
        const isMyTurn = isCurrent && isMe;

        // Glow color: gold when it's the local player's turn, info otherwise.
        const glowRgb = isMyTurn ? "255,215,106" : "0,184,235";

        return (
          <div
            key={player._id}
            className="absolute z-20"
            style={
              {
                left: `calc(50% + ${x}%)`,
                top: `calc(50% + ${y}%)`,
                transform: "translate(-50%, -50%)",
              } as CSSProperties
            }
          >
            <ReactionAnchor playerId={String(player._id)}>
              {/* Turn-handoff wrapper: the whole seat scales up/down between
                  speakers with spring.pop, while the inner element owns the
                  repeating drop-shadow pulse for the current speaker. */}
              <motion.div
                animate={{
                  scale: isCurrent ? 1 : isMe ? 0.9 : 0.84,
                  opacity: isCurrent ? 1 : isMe ? 0.92 : 0.62,
                }}
                transition={reduceMotion ? { duration: 0.18 } : spring.pop}
                className={cn(
                  "flex flex-col items-center text-center",
                  "w-[88px] sm:w-[104px]"
                )}
              >
                <motion.div
                  animate={
                    isCurrent && !reduceMotion
                      ? {
                          scale: [1, 1.05, 1],
                          filter: [
                            `drop-shadow(0 0 6px rgba(${glowRgb},0.4))`,
                            `drop-shadow(0 0 22px rgba(${glowRgb},0.85))`,
                            `drop-shadow(0 0 6px rgba(${glowRgb},0.4))`,
                          ],
                        }
                      : isCurrent
                        ? { filter: `drop-shadow(0 0 16px rgba(${glowRgb},0.7))` }
                        : { scale: 1, filter: "drop-shadow(0 0 0px rgba(0,184,235,0))" }
                  }
                  transition={
                    isCurrent && !reduceMotion
                      ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.18 }
                  }
                  className={cn(
                    "flex w-full flex-col items-center will-change-transform",
                    isCurrent &&
                      "rounded-[var(--r-lg)] border px-2 py-3",
                    isMyTurn
                      ? "border-[color-mix(in_srgb,var(--color-gold)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)]"
                      : isCurrent
                        ? "border-[color-mix(in_srgb,var(--color-info)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)]"
                        : null
                  )}
                >
                  <PlayerAvatar
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    isHost={player.isHost}
                    isBot={player.isBot}
                    size={isCurrent ? "lg" : "orbit"}
                    hideName
                  />

                  <p
                    className={cn(
                      "mt-2 max-w-full truncate font-body text-xs text-[var(--color-text-muted)] sm:text-sm",
                      isCurrent && "text-base text-[var(--color-text)] sm:text-lg",
                      isMe && !isCurrent && "text-[var(--color-text)]"
                    )}
                  >
                    {player.name}
                  </p>

                  <div className="mt-1 h-4">
                    {isCurrent ? (
                      <span
                        className={cn(
                          "font-condensed text-[10px] uppercase tracking-[0.24em]",
                          isMyTurn ? "text-[var(--color-gold)]" : "text-[var(--color-info)]"
                        )}
                      >
                        {isMyTurn ? "Sua vez" : "Falando"}
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              </motion.div>
            </ReactionAnchor>
          </div>
        );
      })}

      <div className="absolute inset-[26%] flex items-center justify-center">
        <div className="max-w-[260px] text-center sm:max-w-[320px]">
          {centerContent}
        </div>
      </div>
    </div>
  );
}

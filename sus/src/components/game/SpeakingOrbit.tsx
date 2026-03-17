"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
  const totalPlayers = players.length;
  const radiusPercent =
    totalPlayers >= 11 ? 41 : totalPlayers >= 9 ? 39 : totalPlayers >= 7 ? 37 : 33;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(82vw,660px)]">
      {players.map((player, index) => {
        const angle = (-90 + (360 / Math.max(totalPlayers, 1)) * index) * (Math.PI / 180);
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        const isCurrent = index === currentSpeakerIndex;
        const isMe = player._id === myPlayerId;

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
              <motion.div
                animate={
                  isCurrent
                    ? {
                        scale: 1.08,
                        boxShadow: [
                          "0 0 0 rgba(0,184,235,0)",
                          "0 0 36px rgba(0,184,235,0.3)",
                          "0 0 0 rgba(0,184,235,0)",
                        ],
                      }
                    : { scale: 1 }
                }
                transition={
                  isCurrent
                    ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.18 }
                }
                className={cn(
                  "flex w-[92px] flex-col items-center text-center sm:w-[108px]",
                  isCurrent && "rounded-[28px] bg-sky-300/10 px-2 py-3 shadow-[0_0_36px_rgba(0,184,235,0.28)]",
                  !isCurrent && "opacity-80",
                  isMe && !isCurrent && "opacity-100"
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
                    "mt-2 max-w-full truncate font-body text-xs text-white/78 sm:text-sm",
                    isCurrent && "text-base text-white sm:text-lg",
                    isMe && !isCurrent && "text-white/90"
                  )}
                >
                  {player.name}
                </p>

                <div className="mt-1 h-4">
                  {isCurrent ? (
                    <span className="font-condensed text-[10px] uppercase tracking-[0.24em] text-sky-100">
                      Falando
                    </span>
                  ) : null}
                </div>
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

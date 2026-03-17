"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicPlayer } from "@/lib/game-view-types";
import PlayerAvatar from "./PlayerAvatar";
import { ReactionAnchor } from "./reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "./ui/glass";

interface SpeakingOrbitProps {
  players: PublicPlayer[];
  currentSpeakerIndex: number;
  progressIndex: number;
  lap: number;
  myPlayerId: Id<"players">;
  centerContent: ReactNode;
}

export default function SpeakingOrbit({
  players,
  currentSpeakerIndex,
  progressIndex,
  lap,
  myPlayerId,
  centerContent,
}: SpeakingOrbitProps) {
  const totalPlayers = players.length;
  const nextSpeaker =
    totalPlayers > 0 ? players[(currentSpeakerIndex + 1) % totalPlayers] ?? null : null;
  const progressPercent =
    totalPlayers > 0 ? ((progressIndex + 1) / totalPlayers) * 100 : 0;
  const radiusPercent = totalPlayers >= 9 ? 40 : totalPlayers >= 7 ? 38 : 35;
  const orbitStyle = {
    "--orbit-progress": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[720px]">
      <div className="glass-orbit-shell absolute inset-0 rounded-[38px]" />
      <div className="glass-orbit-progress absolute inset-[4%] rounded-full" style={orbitStyle} />
      <div className="glass-orbit-core absolute inset-[13%] rounded-full border border-white/10 bg-black/14" />

      <GlassSection className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full px-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-sky-100" />
          <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/72">
            Volta {lap}
          </span>
        </div>
      </GlassSection>

      <GlassSection className="absolute right-4 top-4 z-20 rounded-[20px] px-3 py-2 sm:right-6 sm:top-6">
        <p className="font-condensed text-[10px] uppercase tracking-[0.22em] text-white/50">
          Proximo
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="max-w-[88px] truncate font-body text-sm text-white/85 sm:max-w-[120px]">
            {nextSpeaker?.name ?? "..."}
          </span>
          <ArrowRight size={14} className="text-white/45" />
        </div>
      </GlassSection>

      {players.map((player, index) => {
        const angle = (-90 + (360 / Math.max(totalPlayers, 1)) * index) * (Math.PI / 180);
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        const isCurrent = index === currentSpeakerIndex;
        const isPassed = index < progressIndex;
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
                          "0 0 42px rgba(0,184,235,0.3)",
                          "0 0 0 rgba(0,184,235,0)",
                        ],
                      }
                    : { scale: 1 }
                }
                transition={
                  isCurrent
                    ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
                className={cn(
                  "glass-orbit-node relative flex min-w-[108px] flex-col items-center rounded-[26px] px-3 py-3 text-center sm:min-w-[122px] sm:px-4 sm:py-4",
                  isCurrent && "glass-orbit-node-active border-sky-300/34 bg-sky-300/16",
                  !isCurrent && isPassed && "border-emerald-300/18 bg-emerald-300/10",
                  !isCurrent && !isPassed && "border-white/10 bg-white/7",
                  isMe && !isCurrent && "shadow-[0_0_0_1px_rgba(77,219,168,0.22)]"
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

                <p className="mt-2 max-w-[110px] truncate font-body text-sm text-white/92 sm:text-[15px]">
                  {player.name}
                </p>

                <div className="mt-1 min-h-[16px]">
                  {isCurrent ? (
                    <span className="font-condensed text-[10px] uppercase tracking-[0.24em] text-sky-100">
                      Falando
                    </span>
                  ) : isPassed ? (
                    <span className="font-condensed text-[10px] uppercase tracking-[0.22em] text-emerald-100/88">
                      Ja falou
                    </span>
                  ) : isMe ? (
                    <span className="font-condensed text-[10px] uppercase tracking-[0.22em] text-white/64">
                      Voce
                    </span>
                  ) : (
                    <span className="font-condensed text-[10px] uppercase tracking-[0.22em] text-white/38">
                      Na fila
                    </span>
                  )}
                </div>
              </motion.div>
            </ReactionAnchor>
          </div>
        );
      })}

      <div className="absolute inset-0 flex items-center justify-center p-[24%] sm:p-[22%]">
        <GlassPanel tone="info" className="relative z-10 w-full rounded-[32px] px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative z-10">{centerContent}</div>
        </GlassPanel>
      </div>
    </div>
  );
}

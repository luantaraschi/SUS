"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { GlassPanel, GlassSection } from "../ui/glass";
import {
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  spring,
} from "@/lib/motion";

interface DiscussionPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
}

function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected"
    ? "online"
    : status === "ready"
      ? "ready"
      : "disconnected";
}

export function DiscussionPhase({
  round,
  players,
  myPlayer,
}: DiscussionPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const visiblePlayers = players.filter(
    (player) => player.status !== "disconnected"
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center px-4 py-10">
      {/* Phase indicator */}
      <motion.div
        variants={reduceMotion ? {} : fadeInUp}
        initial="initial"
        animate="animate"
        transition={spring.gentle}
        className="mb-6 w-full"
      >
        <PhaseIndicator
          currentPhase="discussion"
          mode={round.mode}
          className="justify-center"
        />
      </motion.div>

      {/* Main timer + guidance card */}
      <motion.div
        variants={reduceMotion ? {} : scaleIn}
        initial="initial"
        animate="animate"
        transition={{ ...spring.gentle, delay: 0.06 }}
        className="w-full"
      >
        <GlassPanel
          tone="neutral"
          className="rounded-[var(--r-2xl)] px-6 py-6 text-center sm:px-8 sm:py-8"
        >
          {/* Header label */}
          <div className="flex items-center justify-center gap-2">
            <MessageCircle size={14} className="text-[var(--color-info)]" />
            <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
              Fase de discussao
            </p>
          </div>

          {/* Timer */}
          <Timer endsAt={round.phaseEndsAt} className="mt-4 justify-center" />

          {/* Microcopy */}
          <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
            Discutam livremente. Quem esta mais convincente? Quem desconversa?
          </p>
        </GlassPanel>
      </motion.div>

      {/* Player grid */}
      <motion.div
        variants={reduceMotion ? {} : staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-8 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visiblePlayers.map((player) => {
          const isMe = player._id === myPlayer._id;
          return (
            <motion.div
              key={player._id}
              variants={reduceMotion ? {} : staggerItem}
              transition={spring.gentle}
            >
              <ReactionAnchor playerId={String(player._id)}>
                <GlassSection
                  className={[
                    "rounded-[var(--r-xl)] px-4 py-5 text-center",
                    isMe
                      ? "ring-1 ring-[color-mix(in_srgb,var(--color-safe)_38%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-safe)_16%,transparent),var(--shadow-md)]"
                      : "shadow-[var(--shadow-sm)]",
                  ].join(" ")}
                >
                  <PlayerAvatar
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    isHost={player.isHost}
                    isBot={player.isBot}
                    status={getAvatarStatus(player.status)}
                    size="md"
                  />
                  {isMe && (
                    <p className="mt-2 font-condensed text-[10px] uppercase tracking-[0.22em] text-[var(--color-safe)]">
                      Voce
                    </p>
                  )}
                </GlassSection>
              </ReactionAnchor>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

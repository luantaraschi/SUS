"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Users } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { getConnectedPlayers } from "@/lib/players";
import { GlassPanel, GlassSection } from "../ui/glass";
import {
  fadeInUp,
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

// Local-only seating choreography: the table "wakes up" — eyebrow, then the
// timer hero, then the seats settle in one after another.
const tableContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const tableZone = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
};

// Static guidance copy — module-level constant avoids a useless useMemo.
const GUIDANCE = "Discutam: quem convence? Quem desconversa?";

// Per-seat float profile so the circle never breathes in lockstep — each seat
// gets its own gentle amplitude / period from a deterministic index hash.
function seatFloat(index: number) {
  const amp = 4 + (index % 3) * 1.6; // 4 / 5.6 / 7.2 px
  const dur = 3.4 + (index % 4) * 0.55; // 3.4–5.05s
  const delay = (index % 5) * 0.32;
  return { amp, dur, delay };
}

export function DiscussionPhase({
  round,
  players,
  myPlayer,
}: DiscussionPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const visiblePlayers = getConnectedPlayers(players);

  // Visual-only countdown mirror. The real Timer component owns the displayed
  // numerals + tick sound + auto-advance contract; we read phaseEndsAt purely
  // to drive the hero's calm-breathing → rose-urgency state change. setState
  // lives inside the interval callback (allowed), never in the effect body.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!round.phaseEndsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [round.phaseEndsAt]);

  const remaining = round.phaseEndsAt
    ? Math.max(0, Math.ceil((round.phaseEndsAt - now) / 1000))
    : null;
  const urgent = remaining !== null && remaining <= 10;

  const seatCount = visiblePlayers.length;

  return (
    <motion.div
      variants={reduceMotion ? undefined : tableContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center px-4 py-10"
    >
      {/* Phase indicator */}
      <motion.div
        variants={reduceMotion ? undefined : tableZone}
        className="mb-6 w-full"
      >
        <PhaseIndicator
          currentPhase="discussion"
          mode={round.mode}
          className="justify-center"
        />
      </motion.div>

      {/* ── HERO · the timer that the whole table watches ─────────────────── */}
      <motion.div
        variants={reduceMotion ? undefined : tableZone}
        className="w-full"
      >
        <motion.div
          // Signature: the hero card itself breathes calmly while there's time,
          // then snaps tighter + faster the moment urgency kicks in (<=10s).
          // Keyed on `urgent` so the spring re-triggers on the state flip.
          key={urgent ? "urgent" : "calm"}
          animate={
            reduceMotion
              ? undefined
              : urgent
                ? { scale: [1, 1.012, 1] }
                : { scale: [1, 1.006, 1] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: urgent ? 1 : 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          style={{ willChange: "transform" }}
        >
          <GlassPanel
            tone={urgent ? "impostor" : "info"}
            className="relative overflow-hidden rounded-[var(--r-2xl)] px-6 py-7 text-center transition-colors duration-[var(--t-base)] sm:px-8 sm:py-8"
          >
            {/* Tonal aura behind the timer — calm cyan, rose when urgent. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--t-base)]"
              style={{
                background: urgent
                  ? "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-imp) 22%, transparent), transparent 62%)"
                  : "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-info) 16%, transparent), transparent 62%)",
              }}
            />

            {/* Expanding ring that pulses out of the timer when urgent. */}
            {urgent && !reduceMotion && (
              <motion.span
                aria-hidden
                key={`pulse-${remaining}`}
                className="pointer-events-none absolute left-1/2 top-[58%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  border:
                    "2px solid color-mix(in srgb, var(--color-imp) 55%, transparent)",
                }}
                initial={{ scale: 0.6, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}

            <div className="relative z-10">
              {/* Header label — eyebrow with seat count. */}
              <div className="flex items-center justify-center gap-2">
                <motion.span
                  aria-hidden
                  className="inline-flex"
                  animate={
                    reduceMotion
                      ? undefined
                      : urgent
                        ? { rotate: [0, -12, 10, -6, 0] }
                        : { rotate: 0 }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 0.7, repeat: urgent ? Infinity : 0, repeatDelay: 0.6 }
                  }
                >
                  <MessageCircle
                    size={14}
                    className={
                      urgent
                        ? "text-[var(--color-imp)]"
                        : "text-[var(--color-info)]"
                    }
                  />
                </motion.span>
                <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
                  A mesa debate
                </p>
              </div>

              {/* Timer (real countdown + tick + auto-advance preserved). */}
              <Timer endsAt={round.phaseEndsAt} className="mt-4 justify-center" />

              {/* Urgency / calm caption swaps under the numerals. */}
              <p
                className={[
                  "mt-2 font-condensed text-[11px] uppercase tracking-[0.26em] transition-colors duration-[var(--t-base)]",
                  urgent
                    ? "text-[var(--color-imp)]"
                    : "text-[var(--color-text-muted)]",
                ].join(" ")}
              >
                {urgent ? "Tempo acabando — decidam!" : "Tempo de discussao"}
              </p>

              {/* Microcopy guidance. */}
              <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                {GUIDANCE}
              </p>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>

      {/* ── THE TABLE · the circle of players, alive ──────────────────────── */}
      <motion.div
        variants={reduceMotion ? undefined : tableZone}
        className="mt-7 flex w-full items-center justify-center gap-2"
      >
        <Users size={13} className="text-[var(--text-dim)]" />
        <p className="font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
          <span className="tnum">{seatCount}</span> na mesa
        </p>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-5 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visiblePlayers.map((player, index) => {
          const isMe = player._id === myPlayer._id;
          const { amp, dur, delay } = seatFloat(index);
          return (
            <motion.div
              key={player._id}
              variants={reduceMotion ? undefined : staggerItem}
              transition={spring.gentle}
            >
              {/* Per-seat float wrapper — gentle, desynced bob. */}
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : { y: [0, -amp, 0, amp * 0.5, 0] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: dur,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay,
                      }
                }
                style={{ willChange: "transform" }}
              >
                <ReactionAnchor playerId={String(player._id)}>
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03 }}
                    transition={spring.press}
                  >
                    <GlassSection
                      className={[
                        "relative rounded-[var(--r-xl)] px-4 py-5 text-center",
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
                  </motion.div>
                </ReactionAnchor>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Closing nudge — keeps the focus on talking it out. */}
      <motion.p
        variants={reduceMotion ? undefined : fadeInUp}
        className="mt-7 text-center font-body text-sm text-[var(--color-text-muted)]"
      >
        Sem pressa de acusar ainda — a votacao vem logo. Reajam, provoquem,
        observem.
      </motion.p>
    </motion.div>
  );
}

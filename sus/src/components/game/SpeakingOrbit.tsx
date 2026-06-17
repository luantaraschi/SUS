"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
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
  /** True when the local player is the current speaker — tints the marker gold. */
  isMyTurn?: boolean;
}

/**
 * "Roda de interrogatorio" — a single stage with a travelling gold spotlight
 * marker that is handed seat to seat. The marker (a notch on the mid attention
 * ring) animates its ANGLE from the previous seat to the new one along the
 * circle; the arriving seat scales up + lifts, the departing one eases down.
 */
export default function SpeakingOrbit({
  players,
  currentSpeakerIndex,
  myPlayerId,
  centerContent,
  isMyTurn = false,
}: SpeakingOrbitProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const totalPlayers = players.length;
  const radiusPercent =
    totalPlayers >= 11 ? 41 : totalPlayers >= 9 ? 39 : totalPlayers >= 7 ? 37 : 33;

  // Angle (deg) of the current seat measured from 12 o'clock, clockwise.
  const seatAngleDeg = (index: number) =>
    -90 + (360 / Math.max(totalPlayers, 1)) * index;

  // HANDOFF — the marker sweeps its angle along the circle. We accumulate a
  // continuous angle (never wrapping the short way through the center) so the
  // notch always travels around the ring like a passed spotlight.
  const targetAngleRef = useRef<number>(seatAngleDeg(currentSpeakerIndex));
  const markerAngle = useMotionValue(seatAngleDeg(currentSpeakerIndex));
  const smoothAngle = useSpring(markerAngle, {
    stiffness: 260,
    damping: 24,
    restDelta: 0.01,
  });

  useEffect(() => {
    const raw = seatAngleDeg(currentSpeakerIndex);
    const prev = targetAngleRef.current;
    // Walk to the nearest equivalent of `raw` so the sweep is the short arc but
    // still travels around the rim rather than snapping.
    let next = raw;
    while (next - prev > 180) next -= 360;
    while (next - prev < -180) next += 360;
    targetAngleRef.current = next;
    if (reduceMotion) {
      markerAngle.set(next);
      smoothAngle.set(next);
    } else {
      markerAngle.set(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeakerIndex, totalPlayers]);

  // Drive the rotating marker layer off the smoothed angle. The notch sits at
  // 12 o'clock inside this layer; rotating the layer points it at the seat.
  const markerRotate = useTransform(smoothAngle, (a) => a + 90);

  const markerRgb = isMyTurn ? "255,215,106" : "0,184,235";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(82vw,660px)]">
      {/* Base center disc — soft focal anchor. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[24%] rounded-[var(--r-pill)] border border-[var(--w-08)] bg-[radial-gradient(circle,var(--w-08),transparent_70%)]"
      />

      {/* Mid ATTENTION RING + travelling marker. A faint dashed ring at seat
          radius, plus a rotating layer that carries a gold notch/marker which
          is handed from speaker to speaker. */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10 rounded-full border border-dashed"
        style={
          {
            inset: `${50 - radiusPercent}%`,
            borderColor: `color-mix(in srgb, rgb(${markerRgb}) 24%, transparent)`,
            transition: "border-color var(--t-quick) var(--ease-out)",
          } as CSSProperties
        }
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-10"
        style={{
          inset: `${50 - radiusPercent}%`,
          rotate: markerRotate,
        }}
      >
        {/* Notch: a triangle pointing OUTWARD toward the current seat, sitting
            on the ring at 12 o'clock of this rotating layer. */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
            className="flex flex-col items-center"
            style={{ willChange: "transform" }}
          >
            <span
              className="block h-3 w-3 rotate-45 rounded-[2px]"
              style={{
                backgroundColor: `rgb(${markerRgb})`,
                filter: `drop-shadow(0 0 8px rgba(${markerRgb},0.8))`,
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {players.map((player, index) => {
        const angle = seatAngleDeg(index) * (Math.PI / 180);
        const x = Math.cos(angle) * radiusPercent;
        const y = Math.sin(angle) * radiusPercent;
        const isCurrent = index === currentSpeakerIndex;
        const isMe = player._id === myPlayerId;
        const isSelfTurn = isCurrent && isMe;

        // Speaker glow color: gold on the local player's turn, info otherwise.
        const glowRgb = isSelfTurn ? "255,215,106" : "0,184,235";

        // Idle float offset (gentle, only for non-current seats). Deterministic
        // per index so seats don't all bob in unison.
        const floatY = reduceMotion || isCurrent ? 0 : [0, -4, 0, 4, 0];
        const floatDur = 4 + (index % 3);

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
              {/* Stagger-in on phase enter: seats pop in around the circle.
                  Outer wrapper owns the enter + idle float. */}
              <motion.div
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.5 }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, y: floatY }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : {
                        opacity: { ...spring.pop, delay: index * 0.05 },
                        scale: { ...spring.pop, delay: index * 0.05 },
                        y: isCurrent
                          ? { duration: 0.2 }
                          : {
                              duration: floatDur,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                      }
                }
                style={{ willChange: "transform" }}
              >
                {/* HANDOFF scale/lift: arriving seat 0.84->1 spring.pop + lift,
                    departing eases down + desaturates. */}
                <motion.div
                  animate={{
                    scale: isCurrent ? 1 : isMe ? 0.9 : 0.84,
                    opacity: isCurrent ? 1 : isMe ? 0.92 : 0.6,
                    filter: isCurrent
                      ? "saturate(1)"
                      : "saturate(0.72) brightness(0.94)",
                  }}
                  transition={reduceMotion ? { duration: 0.18 } : spring.pop}
                  className={cn(
                    "flex flex-col items-center text-center",
                    "w-[88px] sm:w-[104px]"
                  )}
                >
                  {/* Inner element owns the repeating drop-shadow glow for the
                      current speaker. Glow stays filter:drop-shadow — never a
                      boxShadow — so the round avatar lights up, not a box. */}
                  <motion.div
                    animate={
                      isCurrent && !reduceMotion
                        ? {
                            scale: [1, 1.05, 1],
                            filter: [
                              `drop-shadow(0 6px 10px rgba(0,0,0,0.28)) drop-shadow(0 0 6px rgba(${glowRgb},0.4))`,
                              `drop-shadow(0 10px 16px rgba(0,0,0,0.34)) drop-shadow(0 0 22px rgba(${glowRgb},0.85))`,
                              `drop-shadow(0 6px 10px rgba(0,0,0,0.28)) drop-shadow(0 0 6px rgba(${glowRgb},0.4))`,
                            ],
                          }
                        : isCurrent
                          ? {
                              filter: `drop-shadow(0 8px 14px rgba(0,0,0,0.3)) drop-shadow(0 0 16px rgba(${glowRgb},0.7))`,
                            }
                          : {
                              scale: 1,
                              filter: "drop-shadow(0 0 0px rgba(0,184,235,0))",
                            }
                    }
                    transition={
                      isCurrent && !reduceMotion
                        ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.18 }
                    }
                    className={cn(
                      "flex w-full flex-col items-center will-change-transform",
                      isCurrent && "rounded-[var(--r-lg)] px-2 py-3"
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
                            isSelfTurn
                              ? "text-[var(--color-gold)]"
                              : "text-[var(--color-info)]"
                          )}
                        >
                          {isSelfTurn ? "Sua vez" : "Falando"}
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </ReactionAnchor>
          </div>
        );
      })}

      <div className="absolute inset-[26%] z-20 flex items-center justify-center">
        <div className="max-w-[260px] text-center sm:max-w-[320px]">
          {centerContent}
        </div>
      </div>
    </div>
  );
}

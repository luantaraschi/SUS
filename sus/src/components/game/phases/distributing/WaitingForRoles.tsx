"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../PlayerAvatar";
import PostItBoard from "../../PostItBoard";
import { ReactionAnchor } from "../../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../../ui/glass";
import { Burst } from "@/components/ui/Burst";
import type { PublicPlayer } from "@/lib/game-view-types";
import { getConnectedPlayers } from "@/lib/players";
import { Check, CircleDashed, Feather, Users, WifiOff } from "lucide-react";

/** ms after which an unconfirmed (non-ready) human player is treated as offline. */
const OFFLINE_TIMEOUT_MS = 10_000;

/* Local springs (do not edit shared motion.ts). Mirror spring.pop/gentle. */
const SPRING_POP = { type: "spring", stiffness: 500, damping: 22 } as const;
const SPRING_GENTLE = { type: "spring", stiffness: 260, damping: 24 } as const;

/**
 * A single player tile in the readiness grid. Owns its own offline timer so
 * a player who never confirms stops showing an infinite spinner and instead
 * reads "Offline - aguardando..." after ~10s. Purely client-side; no Convex
 * change. The timer resets whenever the player flips to ready.
 */
function ReadinessTile({
  player,
  index,
  reduceMotion,
}: {
  player: PublicPlayer;
  index: number;
  reduceMotion: boolean;
}) {
  const isReady = player.status === "ready";
  const [timedOut, setTimedOut] = useState(false);

  // Flip to "offline" only via the timeout callback — never set state
  // synchronously in the effect body. While ready, the derived `staleReading`
  // ignores `timedOut`, so no synchronous reset is needed.
  useEffect(() => {
    if (isReady) return;
    const timer = window.setTimeout(
      () => setTimedOut(true),
      OFFLINE_TIMEOUT_MS
    );
    return () => {
      window.clearTimeout(timer);
      setTimedOut(false);
    };
  }, [isReady, player._id]);

  const staleReading = !isReady && timedOut;

  const statusLabel = isReady
    ? "Pronto"
    : staleReading
      ? "Offline"
      : "Lendo";

  return (
    <ReactionAnchor playerId={String(player._id)} className="h-full">
      {/* Stagger the tiles in like a roll-call ticking down the line. */}
      <motion.div
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : { ...SPRING_POP, delay: 0.18 + index * 0.05 }
        }
        className="h-full"
      >
        <GlassSection
          className={cn(
            "relative h-full overflow-hidden rounded-[var(--r-lg)] p-4",
            "transition-[background-color,border-color,box-shadow] duration-[var(--t-base)] ease-[var(--ease-out)]",
            isReady
              ? "border-[color-mix(in_srgb,var(--color-safe)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_13%,transparent)] shadow-[0_0_22px_-8px_color-mix(in_srgb,var(--color-safe)_60%,transparent)]"
              : staleReading
                ? "border-[var(--w-08)] bg-[var(--w-04)] opacity-70"
                : "border-[var(--w-12)] bg-[var(--w-08)]"
          )}
        >
          {/* Green check-stamp ring pulse — fires once when the player flips to
              ready (keyed on isReady so it remounts on the transition, not via
              an effect+setState). */}
          {!reduceMotion && isReady && (
            <motion.span
              key="ready-pulse"
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[var(--r-lg)]"
              style={{
                boxShadow:
                  "inset 0 0 0 2px var(--color-safe), 0 0 26px -4px color-mix(in srgb, var(--color-safe) 60%, transparent)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-3 flex h-7 min-w-7 items-center justify-center rounded-[var(--r-pill)] border px-2.5 font-condensed text-[10px] uppercase tracking-[0.2em]",
                "transition-colors duration-[var(--t-base)]",
                isReady
                  ? "border-[color-mix(in_srgb,var(--color-safe)_34%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_20%,transparent)] text-[var(--color-text)]"
                  : staleReading
                    ? "border-[color-mix(in_srgb,var(--color-warn)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_14%,transparent)] text-[var(--color-text-muted)]"
                    : "border-[var(--w-12)] bg-[var(--w-08)] text-[var(--text-dim)]"
              )}
            >
              {/* Status label swaps with a tiny pop on each change. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={statusLabel}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {statusLabel}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Avatar gives a satisfying spring pop the moment it goes ready. */}
            <motion.div
              animate={
                reduceMotion || !isReady
                  ? { scale: 1 }
                  : { scale: [1, 1.12, 1] }
              }
              transition={reduceMotion ? { duration: 0 } : SPRING_POP}
            >
              <PlayerAvatar
                name={player.name}
                avatarSeed={player.emoji}
                imageUrl={player.avatarImageUrl}
                size="sm"
                hideName
              />
            </motion.div>

            <p className="mt-3 w-full truncate font-body text-sm text-[var(--color-text)]">
              {player.name}
            </p>

            {/* Status medallion: ready = check-stamp (spring.pop + drawn check);
                offline = wifi-off; otherwise a calm pulsing dashed ring. */}
            <div
              className={cn(
                "mt-3 flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)] border transition-colors duration-[var(--t-base)]",
                isReady
                  ? "border-[color-mix(in_srgb,var(--color-safe)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_18%,transparent)]"
                  : "border-[var(--w-12)] bg-[var(--w-08)]"
              )}
            >
              {isReady ? (
                <ReadyCheck reduceMotion={reduceMotion} />
              ) : staleReading ? (
                <WifiOff size={15} className="text-[var(--color-warn)]" />
              ) : reduceMotion ? (
                <CircleDashed size={16} className="text-[var(--text-dim)]" />
              ) : (
                // Calm breathing dashed ring while "Lendo...".
                <motion.span
                  className="inline-flex"
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1, 0.92] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CircleDashed size={16} className="text-[var(--color-info)]" />
                </motion.span>
              )}
            </div>

            {/* Sub-status line — "lendo..." (breathing) or "aguardando..." offline. */}
            {staleReading && !isReady ? (
              <p className="mt-2 font-body text-[10px] leading-tight text-[var(--color-text-muted)]">
                aguardando...
              </p>
            ) : !isReady ? (
              <motion.p
                className="mt-2 font-body text-[10px] leading-tight text-[var(--text-dim)]"
                animate={reduceMotion ? undefined : { opacity: [0.45, 0.9, 0.45] }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                }
              >
                lendo o secreto...
              </motion.p>
            ) : null}
          </div>
        </GlassSection>
      </motion.div>
    </ReactionAnchor>
  );
}

/** A green check that draws itself in once (stroke pathLength), mirroring the
 *  ReadyConfirmation seal language. */
function ReadyCheck({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) {
    return <Check size={16} className="text-[var(--color-safe)]" />;
  }
  return (
    <motion.svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-safe)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  );
}

/** Status board: everyone confirms on their own screen; who is ready shows here. */
export function RolesReadinessBoard({ players }: { players: PublicPlayer[] }) {
  const reduceMotion = useReducedMotion() ?? false;

  const roster = useMemo(() => getConnectedPlayers(players), [players]);
  const total = roster.length;
  const readyCount = useMemo(
    () => roster.filter((p) => p.status === "ready").length,
    [roster]
  );
  const allReady = total > 0 && readyCount === total;
  const progress = total > 0 ? (readyCount / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      {/* Burst fires once everyone has reported in — keyed on the all-ready flag. */}
      <span className="pointer-events-none absolute left-1/2 top-[18%] z-50 h-0 w-0 -translate-x-1/2">
        <Burst
          fire={allReady ? readyCount : 0}
          colors={["var(--color-safe)", "var(--color-gold)", "var(--color-info)"]}
          count={18}
        />
      </span>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl"
      >
        <GlassPanel tone="info" className="rounded-[var(--r-2xl)] p-6 sm:p-8">
          <div className="relative z-10">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              {/* Roll-call sigil — squad icon in a glass medallion. */}
              <motion.div
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.2 } : SPRING_POP}
                className="flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] shadow-[var(--shadow-md)]"
              >
                <Users size={28} className="text-[var(--color-info)]" />
              </motion.div>
              <p className="mt-4 font-condensed text-xs uppercase tracking-[0.34em] text-[var(--text-dim)]">
                Chamada do esquadrao
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
                Distribuindo papeis
              </h2>
              <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Cada jogador precisa conferir a propria tela. Quem ja confirmou
                aparece marcado abaixo.
              </p>

              {/* Collective progress — "X/Y prontos" with a thin animated fill. */}
              <div className="mt-6 w-full max-w-sm">
                <div className="flex items-center justify-between font-condensed text-[11px] uppercase tracking-[0.22em]">
                  <span
                    className={cn(
                      "transition-colors duration-[var(--t-base)]",
                      allReady
                        ? "text-[var(--color-safe)]"
                        : "text-[var(--color-text-muted)]"
                    )}
                  >
                    {allReady ? "Todos prontos" : "Confirmados"}
                  </span>
                  <span className="tnum text-[var(--color-text)]">
                    <motion.span
                      key={readyCount}
                      initial={reduceMotion ? false : { scale: 1.35, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={reduceMotion ? { duration: 0 } : SPRING_POP}
                      className="inline-block"
                    >
                      {readyCount}
                    </motion.span>
                    /{total} prontos
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[var(--r-pill)] bg-[var(--w-08)]">
                  <motion.div
                    className="h-full rounded-[var(--r-pill)]"
                    style={{
                      background: allReady
                        ? "linear-gradient(90deg, var(--color-safe), var(--color-gold))"
                        : "linear-gradient(90deg, var(--color-info), var(--color-safe))",
                    }}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={
                      reduceMotion
                        ? { duration: 0.2 }
                        : { ...SPRING_GENTLE }
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {roster.map((player, index) => (
                <ReadinessTile
                  key={player._id}
                  player={player}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

/** An anticipatory "aguardando o mestre" beat — a quill writing on a line with
 *  breathing ink dots. Pure visual; respects reduced motion. */
function WritingQuill({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative mx-auto flex h-14 w-44 items-end justify-center">
      {/* The ink line the quill writes across. */}
      <span
        aria-hidden
        className="absolute bottom-3 left-1/2 h-px w-32 -translate-x-1/2 rounded-[var(--r-pill)] bg-[var(--w-12)]"
      />
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="absolute bottom-3 left-[calc(50%-4rem)] h-[2px] rounded-[var(--r-pill)]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-info), color-mix(in srgb, var(--color-special) 80%, transparent))",
            transformOrigin: "left center",
          }}
          animate={{ width: ["0rem", "8rem", "8rem", "0rem"] }}
          transition={{
            duration: 2.6,
            ease: "easeInOut",
            repeat: Infinity,
            times: [0, 0.5, 0.72, 1],
          }}
        />
      )}

      {/* The quill — glides left→right tracing the line, then resets. */}
      <motion.span
        aria-hidden
        className="absolute bottom-1.5"
        style={{ color: "var(--color-info)" }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [-58, 58, 58, -58],
                rotate: [-8, -2, -2, -8],
                y: [0, -2, -2, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 2.6,
                ease: "easeInOut",
                repeat: Infinity,
                times: [0, 0.5, 0.72, 1],
              }
        }
      >
        <Feather size={26} strokeWidth={2} />
      </motion.span>
    </div>
  );
}

/** Three breathing dots that ripple — a tasteful "aguardando" idle. */
function BreathingDots({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) {
    return (
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-[var(--r-pill)] bg-[var(--color-info)] opacity-70"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-1 flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-[var(--r-pill)] bg-[var(--color-info)]"
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.15, 0.8] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </div>
  );
}

/** Shown to non-master players while the master is writing the two questions. */
export function MasterCreatingQuestion({
  roomId,
  sessionId,
}: {
  roomId: Id<"rooms">;
  sessionId: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-black/72 text-center backdrop-blur-sm">
      <PostItBoard roomId={roomId} sessionId={sessionId} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-info)_18%,transparent),transparent_38%),radial-gradient(circle_at_bottom,color-mix(in_srgb,var(--color-special)_22%,transparent),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center px-4">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl"
        >
          <GlassPanel tone="info" className="rounded-[var(--r-xl)] px-6 py-5">
            <div className="relative z-10 text-center">
              {/* Anticipatory writing state — a quill tracing an ink line. */}
              <motion.div
                initial={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.2 } : SPRING_POP}
                className="mx-auto"
              >
                <WritingQuill reduceMotion={reduceMotion} />
              </motion.div>

              <p className="mt-3 font-condensed text-xs uppercase tracking-[0.32em] text-[var(--text-dim)]">
                Aguardando o mestre
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)]">
                O mestre esta criando a pergunta
              </h2>
              <BreathingDots reduceMotion={reduceMotion} />
              <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Enquanto isso, deixe um recado anonimo no mural. A rodada
                continua assim que ele confirmar.
              </p>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../PlayerAvatar";
import PostItBoard from "../../PostItBoard";
import { ReactionAnchor } from "../../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../../ui/glass";
import type { PublicPlayer } from "@/lib/game-view-types";
import { Check, CircleDashed, Clock3, Sparkles, WifiOff } from "lucide-react";

/** ms after which an unconfirmed (non-ready) human player is treated as offline. */
const OFFLINE_TIMEOUT_MS = 10_000;

/**
 * A single player tile in the readiness grid. Owns its own offline timer so
 * a player who never confirms stops showing an infinite spinner and instead
 * reads "Offline - aguardando..." after ~10s. Purely client-side; no Convex
 * change. The timer resets whenever the player flips to ready.
 */
function ReadinessTile({
  player,
  reduceMotion,
}: {
  player: PublicPlayer;
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
      <GlassSection
        className={cn(
          "h-full rounded-[var(--r-lg)] p-4 transition-[background-color,border-color] duration-[var(--t-quick)]",
          isReady
            ? "border-[color-mix(in_srgb,var(--color-safe)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
            : staleReading
              ? "border-[var(--w-08)] bg-[var(--w-04)] opacity-70"
              : "border-[var(--w-12)] bg-[var(--w-08)]"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "mb-3 flex h-7 min-w-7 items-center justify-center rounded-[var(--r-pill)] border px-2.5 font-condensed text-[10px] uppercase tracking-[0.2em]",
              isReady
                ? "border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_18%,transparent)] text-[var(--color-text)]"
                : staleReading
                  ? "border-[color-mix(in_srgb,var(--color-warn)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_14%,transparent)] text-[var(--color-text-muted)]"
                  : "border-[var(--w-12)] bg-[var(--w-08)] text-[var(--text-dim)]"
            )}
          >
            {statusLabel}
          </div>
          <PlayerAvatar
            name={player.name}
            avatarSeed={player.emoji}
            imageUrl={player.avatarImageUrl}
            size="sm"
            hideName
          />
          <p className="mt-3 w-full truncate font-body text-sm text-[var(--color-text)]">
            {player.name}
          </p>
          <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-[var(--r-pill)] border border-[var(--w-12)] bg-[var(--w-08)]">
            {isReady ? (
              <Check size={16} className="text-[var(--color-safe)]" />
            ) : staleReading ? (
              <WifiOff size={15} className="text-[var(--color-warn)]" />
            ) : (
              <CircleDashed
                size={16}
                className={cn(
                  "text-[var(--text-dim)]",
                  !reduceMotion && "animate-spin"
                )}
              />
            )}
          </div>
          {staleReading && !isReady && (
            <p className="mt-2 font-body text-[10px] leading-tight text-[var(--color-text-muted)]">
              aguardando...
            </p>
          )}
        </div>
      </GlassSection>
    </ReactionAnchor>
  );
}

/** Status board: everyone confirms on their own screen; who is ready shows here. */
export function RolesReadinessBoard({ players }: { players: PublicPlayer[] }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl"
      >
        <GlassPanel tone="info" className="rounded-[var(--r-2xl)] p-6 sm:p-8">
          <div className="relative z-10">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] shadow-[var(--shadow-md)]">
                <Clock3 size={28} className="text-[var(--color-info)]" />
              </div>
              <p className="mt-4 font-condensed text-xs uppercase tracking-[0.34em] text-[var(--text-dim)]">
                Preparando rodada
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
                Distribuindo papeis
              </h2>
              <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                Cada jogador precisa conferir a propria tela. Quem ja confirmou
                aparece marcado abaixo.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {players
                .filter((player) => player.status !== "disconnected")
                .map((player) => (
                  <ReadinessTile
                    key={player._id}
                    player={player}
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)]">
                <Sparkles size={24} className="text-[var(--color-info)]" />
              </div>
              <p className="mt-4 font-condensed text-xs uppercase tracking-[0.32em] text-[var(--text-dim)]">
                Modo mestre
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--color-text)]">
                O mestre esta criando a pergunta
              </h2>
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

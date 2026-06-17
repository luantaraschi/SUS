"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ShareResult from "../../ShareResult";
import GlassSelect from "../../ui/GlassSelect";
import { GlassPanel } from "../../ui/glass";
import { fadeInUp, spring } from "@/lib/motion";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { getConnectedPlayers } from "@/lib/players";

interface ShareSectionProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  room: Doc<"rooms">;
  isMasterMode: boolean;
  isHost: boolean;
  isSpectator: boolean;
  isReturningToLobby: boolean;
  selectedMasterId: string | null;
  onSelectMaster: (value: string) => void;
  share: { title: string; text: string; url: string };
  onStartNextRoundHost: () => void;
  onRequestNextRound: () => void;
  onStartNextRoundDefault: () => void;
  onBackToLobby: () => void;
}

/** A "Voltando..." style 3-dot loader that shimmers while a transition runs. */
function LoadingDots({ label, reduceMotion }: { label: string; reduceMotion: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-current"
            animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }
            }
          />
        ))}
      </span>
    </span>
  );
}

/** Primary CTA: hover lift + sweep highlight, press scale(0.96). */
function PrimaryAction({
  children,
  onClick,
  disabled,
  reduceMotion,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={reduceMotion || disabled ? undefined : { y: -2 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.96 }}
      transition={spring.press}
      className="group/cta relative overflow-hidden rounded-[var(--r-md)]"
    >
      {/* Sweep highlight on hover. */}
      {!reduceMotion && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 z-20 w-1/3 -translate-x-full bg-[linear-gradient(105deg,transparent,color-mix(in_srgb,white_55%,transparent),transparent)] opacity-0 transition-transform duration-700 ease-out group-hover/cta:translate-x-[360%] group-hover/cta:opacity-100"
        />
      )}
      <Button
        className={cn(
          "h-[54px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-sm font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)] disabled:opacity-60",
          className
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </Button>
    </motion.div>
  );
}

export function ShareSection({
  round,
  players,
  myPlayer,
  room,
  isMasterMode,
  isHost,
  isSpectator,
  isReturningToLobby,
  selectedMasterId,
  onSelectMaster,
  share,
  onStartNextRoundHost,
  onRequestNextRound,
  onStartNextRoundDefault,
  onBackToLobby,
}: ShareSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;

  const hasRequestedNext = round.nextRoundReadyBy?.includes(myPlayer._id) ?? false;
  const nextReadyCount = round.nextRoundReadyBy?.length ?? 0;

  const nextMasterOptions = getConnectedPlayers(players).map((player) => ({
    value: String(player._id),
    label: `${player.name}${player.isHost ? " (Host)" : ""}`,
  }));

  const VoteCount = (
    <motion.span
      key={nextReadyCount}
      initial={reduceMotion ? undefined : { scale: 1.4 }}
      animate={reduceMotion ? undefined : { scale: 1 }}
      transition={{ duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}
      className="tnum inline-block"
    >
      {nextReadyCount}
    </motion.span>
  );

  return (
    <motion.div
      variants={reduceMotion ? undefined : fadeInUp}
      initial="initial"
      animate="animate"
      transition={spring.gentle}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <GlassPanel tone="info" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            <Sparkles size={14} className="text-[var(--color-info)]" />
            Proxima acao
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {/* Reuse the shared ShareResult component (owns share/copy logic). */}
            <ShareResult title={share.title} text={share.text} url={share.url} />

            {isMasterMode && !isSpectator ? (
              isHost ? (
                <PrimaryAction
                  reduceMotion={reduceMotion}
                  disabled={isReturningToLobby}
                  onClick={onStartNextRoundHost}
                >
                  {isReturningToLobby ? (
                    <LoadingDots label="Iniciando" reduceMotion={reduceMotion} />
                  ) : (
                    "Proxima rodada (Host)"
                  )}
                </PrimaryAction>
              ) : (
                <PrimaryAction
                  reduceMotion={reduceMotion}
                  disabled={hasRequestedNext}
                  onClick={onRequestNextRound}
                  className="disabled:border-[var(--w-08)] disabled:bg-[var(--w-16)] disabled:text-[var(--text-dim)]"
                >
                  {hasRequestedNext ? (
                    <span className="inline-flex items-center gap-1">Aguardando ({VoteCount} votos)</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">Proxima rodada ({VoteCount} votos)</span>
                  )}
                </PrimaryAction>
              )
            ) : !isSpectator && isHost ? (
              <PrimaryAction
                reduceMotion={reduceMotion}
                disabled={isReturningToLobby}
                onClick={onStartNextRoundDefault}
              >
                {isReturningToLobby ? (
                  <LoadingDots label="Iniciando" reduceMotion={reduceMotion} />
                ) : (
                  "Proxima rodada"
                )}
              </PrimaryAction>
            ) : null}

            {isHost && (
              <motion.div
                whileHover={reduceMotion || isReturningToLobby ? undefined : { y: -2 }}
                whileTap={reduceMotion || isReturningToLobby ? undefined : { scale: 0.96 }}
                transition={spring.press}
                className="rounded-[var(--r-md)]"
              >
                <Button
                  onClick={onBackToLobby}
                  disabled={isReturningToLobby}
                  className="h-[54px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-sm font-semibold text-[var(--color-text)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] disabled:opacity-60"
                >
                  {isReturningToLobby ? (
                    <LoadingDots label="Voltando" reduceMotion={reduceMotion} />
                  ) : (
                    "Voltar ao Lobby"
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {!isMasterMode && !isHost && (
            <p className="mt-4 font-body text-sm text-[var(--color-text-muted)]">
              Aguardando o host iniciar a proxima rodada.
            </p>
          )}
        </div>
      </GlassPanel>

      {isMasterMode && isHost && !isSpectator ? (
        <GlassPanel tone="special" className="rounded-[var(--r-xl)] px-5 py-6 sm:px-6">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              <Crown size={14} className="text-[var(--color-gold)]" />
              Mestre da proxima rodada
            </div>
            <p className="mt-4 font-body text-sm leading-relaxed text-[var(--color-text-muted)]">
              Defina quem conduz a proxima rodada antes de avancar.
            </p>
            <div className="mt-5">
              <GlassSelect
                ariaLabel="Selecionar mestre da proxima rodada"
                value={
                  selectedMasterId ??
                  String(
                    room.settings.customMasterId ??
                      players.find((player) => player.isHost)?._id ??
                      ""
                  )
                }
                onChange={onSelectMaster}
                options={nextMasterOptions}
                tone="special"
                className="w-full"
              />
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div />
      )}
    </motion.div>
  );
}

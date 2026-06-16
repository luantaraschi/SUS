"use client";

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

  const nextMasterOptions = players
    .filter((player) => player.status !== "disconnected")
    .map((player) => ({
      value: String(player._id),
      label: `${player.name}${player.isHost ? " (Host)" : ""}`,
    }));

  const primaryButtonClass =
    "h-[54px] rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-sm font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)] transition-transform duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:opacity-60";

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
                <Button
                  className={primaryButtonClass}
                  disabled={isReturningToLobby}
                  onClick={onStartNextRoundHost}
                >
                  Proxima rodada (Host)
                </Button>
              ) : (
                <Button
                  className={cn(
                    primaryButtonClass,
                    "disabled:border-[var(--w-08)] disabled:bg-[var(--w-16)] disabled:text-[var(--text-dim)]"
                  )}
                  disabled={hasRequestedNext}
                  onClick={onRequestNextRound}
                >
                  {hasRequestedNext
                    ? `Aguardando... (${nextReadyCount} votos)`
                    : `Proxima rodada (${nextReadyCount} votos)`}
                </Button>
              )
            ) : !isSpectator && isHost ? (
              <Button
                className={primaryButtonClass}
                disabled={isReturningToLobby}
                onClick={onStartNextRoundDefault}
              >
                Proxima rodada
              </Button>
            ) : null}

            {isHost && (
              <Button
                onClick={onBackToLobby}
                disabled={isReturningToLobby}
                className="h-[54px] rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-sm font-semibold text-[var(--color-text)] transition-[transform,background-color] duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-[var(--glass-2)] disabled:translate-y-0 disabled:opacity-60"
              >
                {isReturningToLobby ? "Voltando..." : "Voltar ao Lobby"}
              </Button>
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

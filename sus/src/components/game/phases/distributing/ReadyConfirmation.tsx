"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation } from "convex/react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassPanel, GlassSection } from "../../ui/glass";
import type { RoleView, SafeRound } from "@/lib/game-view-types";
import { getRoleMeta } from "./roleMeta";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

interface ReadyConfirmationProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

/**
 * Secret reveal tile. The content is ALWAYS in the DOM but hidden via
 * opacity+scale (NOT a CSS `filter: blur`) so toggling it never triggers a
 * blur repaint/reflow flash. While hidden it is `select-none` + aria-hidden
 * so it can't be copied or read out. A "Segure para ver" overlay sits on top
 * until the player presses and holds.
 */
function SecretTile({
  label,
  helper,
  content,
  badge,
  badgeTone,
  isRevealing,
  reduceMotion,
}: {
  label: string;
  helper: string;
  content: string;
  badge: string;
  badgeTone: "impostor" | "safe";
  isRevealing: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            {label}
          </p>
          <p className="mt-2 font-body text-sm text-[var(--color-text-muted)]">
            {helper}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-[var(--r-pill)] border px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.22em]",
            badgeTone === "impostor"
              ? "border-[color-mix(in_srgb,var(--color-imp)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_16%,transparent)] text-[var(--color-imp)]"
              : "border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_16%,transparent)] text-[var(--color-safe)]"
          )}
        >
          {badge}
        </div>
      </div>

      <div className="relative mt-5 min-h-[7.5rem] overflow-hidden rounded-[var(--r-lg)] border border-[var(--w-12)] bg-black/25 shadow-[inset_0_1px_0_var(--w-08)]">
        {/* The secret. Hidden via opacity+scale only — no filter, no flash. */}
        <div
          aria-hidden={!isRevealing}
          className={cn(
            "flex min-h-[7.5rem] items-center justify-center px-5 py-6 text-center transition-[opacity,transform] duration-[var(--t-base)] ease-[var(--ease-out)]",
            isRevealing
              ? "opacity-100"
              : "select-none pointer-events-none opacity-0",
            !isRevealing && !reduceMotion && "scale-95"
          )}
        >
          <p className="font-display text-2xl text-[var(--color-text)] sm:text-3xl">
            {content}
          </p>
        </div>

        {/* Locked overlay — fades out (no blur) while held. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/30 transition-opacity duration-[var(--t-base)] ease-[var(--ease-out)]",
            isRevealing ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--r-pill)] border border-[var(--w-16)] bg-[var(--w-08)]">
            <EyeOff size={16} className="text-[var(--text-dim)]" />
          </span>
          <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
            Conteudo protegido
          </span>
        </div>
      </div>
    </div>
  );
}

export function ReadyConfirmation({
  round,
  myPlayer,
  myRole,
  room,
  sessionId,
}: ReadyConfirmationProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [isRevealing, setIsRevealing] = useState(false);
  const confirmSeen = useMutation(api.rounds.confirmSeen);

  const roleMeta = getRoleMeta(myRole?.role, room.mode);
  const RoleIcon = roleMeta.icon;

  const isImpostor = myRole?.role === "impostor";
  const hasSecret = Boolean(myRole?.secretContent);
  const showHoldButton = myRole?.role === "player" || (isImpostor && hasSecret);

  const handleConfirm = () => {
    void confirmSeen({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--w-08),transparent_26%),radial-gradient(circle_at_bottom,color-mix(in_srgb,var(--color-special)_18%,transparent),transparent_36%)]" />

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <GlassPanel
          tone={roleMeta.tone}
          className="rounded-[var(--r-2xl)] px-5 py-6 sm:px-7 sm:py-8"
        >
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] shadow-[var(--shadow-md)]",
                    roleMeta.tone === "impostor" && "text-[var(--color-imp)]",
                    roleMeta.tone === "safe" && "text-[var(--color-safe)]"
                  )}
                >
                  <RoleIcon size={24} />
                </div>
                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                    {roleMeta.accentLabel}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-[var(--color-text)] sm:text-[2rem]">
                    {roleMeta.title}
                  </h2>
                </div>
              </div>

              <div className="self-start rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Rodada em preparo
              </div>
            </div>

            <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {roleMeta.subtitle}
            </p>

            {/* Per-role inline guidance. */}
            <div
              className={cn(
                "mt-4 flex items-start gap-2.5 rounded-[var(--r-md)] border px-4 py-3",
                roleMeta.tone === "impostor"
                  ? "border-[color-mix(in_srgb,var(--color-imp)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-imp)_10%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-safe)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_10%,transparent)]"
              )}
            >
              <RoleIcon
                size={16}
                className={cn(
                  "mt-0.5 shrink-0",
                  roleMeta.tone === "impostor"
                    ? "text-[var(--color-imp)]"
                    : "text-[var(--color-safe)]"
                )}
              />
              <p className="font-body text-sm leading-relaxed text-[var(--color-text)]">
                {roleMeta.guide}
              </p>
            </div>

            {isImpostor && !hasSecret ? (
              <GlassSection className="mt-6 rounded-[var(--r-lg)] p-5 text-left sm:p-6">
                <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                  Sua situacao
                </p>
                <p className="mt-3 font-body text-base leading-relaxed text-[var(--color-text)]">
                  {room.mode === "word"
                    ? "Voce nao recebeu a palavra. Leia o clima da mesa, absorva o contexto e blefe com precisao."
                    : "Voce recebeu a pergunta alternativa. Responda como se estivesse totalmente no contexto."}
                </p>
              </GlassSection>
            ) : (
              <GlassSection className="mt-6 rounded-[var(--r-lg)] p-5 sm:p-6">
                <SecretTile
                  label={
                    isImpostor
                      ? room.mode === "word"
                        ? "Dica de contexto"
                        : "Pergunta do impostor"
                      : room.mode === "word"
                        ? "Sua palavra secreta"
                        : "Sua pergunta"
                  }
                  helper={
                    isImpostor
                      ? "Segure o botao abaixo para ver seu segredo."
                      : "Revele so para voce e memorize antes de confirmar."
                  }
                  content={myRole?.secretContent ?? ""}
                  badge={isImpostor ? "Sus" : "Seguro"}
                  badgeTone={isImpostor ? "impostor" : "safe"}
                  isRevealing={isRevealing}
                  reduceMotion={reduceMotion}
                />

                {!isImpostor && room.mode === "word" && (
                  <p className="mt-4 text-center font-body text-sm text-[var(--text-dim)]">
                    Pense em uma pista relacionada. Seja especifico sem entregar
                    demais.
                  </p>
                )}
              </GlassSection>
            )}

            {showHoldButton && (
              <button
                type="button"
                onPointerDown={() => setIsRevealing(true)}
                onPointerUp={() => setIsRevealing(false)}
                onPointerLeave={() => setIsRevealing(false)}
                onPointerCancel={() => setIsRevealing(false)}
                onContextMenu={(event) => event.preventDefault()}
                aria-pressed={isRevealing}
                className="group relative mt-5 w-full cursor-pointer touch-none overflow-hidden rounded-[var(--r-md)] border border-[var(--w-16)] bg-[var(--glass-1)] px-4 py-4 text-left text-[var(--color-text)] transition-[background-color,box-shadow,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
              >
                {/* Press progress / fill — width animates while held. */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 rounded-[inherit] bg-[var(--w-16)] transition-[width] ease-[var(--ease-out)]",
                    isRevealing
                      ? "w-full duration-[600ms]"
                      : "w-0 duration-[var(--t-quick)]"
                  )}
                />
                {/* Border glow while held. */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset transition-opacity duration-[var(--t-quick)]",
                    isRevealing
                      ? "opacity-100 ring-[color-mix(in_srgb,var(--color-info)_55%,transparent)]"
                      : "opacity-0 ring-transparent"
                  )}
                />
                <span className="relative flex items-center justify-between gap-4">
                  <span>
                    <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                      Privado
                    </span>
                    <span className="mt-1 block font-display text-xl">
                      {isRevealing
                        ? "Solte para esconder"
                        : "Segure para ver seu segredo"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border transition-[transform,border-color] duration-[var(--t-quick)]",
                      isRevealing
                        ? "scale-110 border-[color-mix(in_srgb,var(--color-info)_55%,transparent)] bg-[var(--glass-2)]"
                        : "border-[var(--w-12)] bg-[var(--w-08)] group-hover:scale-105"
                    )}
                  >
                    {isRevealing ? (
                      <Eye size={18} />
                    ) : (
                      <Fingerprint size={18} />
                    )}
                  </span>
                </span>
              </button>
            )}

            <Button
              onClick={handleConfirm}
              className="mt-5 h-[52px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)] transition-transform duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-white"
            >
              {room.mode === "word" ? "Ja decorei" : "Entendi"}
            </Button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

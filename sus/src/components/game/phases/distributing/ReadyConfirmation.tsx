"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useMutation } from "convex/react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Burst } from "@/components/ui/Burst";
import type { RoleView, SafeRound } from "@/lib/game-view-types";
import { getRoleMeta, type RoleTemperature } from "./roleMeta";
import { Fingerprint, Eye } from "lucide-react";

interface ReadyConfirmationProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

/* Local springs (do not edit shared motion.ts). Mirror spring.pop/gentle. */
const SPRING_POP: Transition = { type: "spring", stiffness: 500, damping: 22 };
const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

/* ---- Per-temperature seal theming -------------------------------------- */

type SealTheme = {
  accent: string; // primary themed color token
  ring: string; // medallion ring border
  halo: string; // radial halo color-mix
  haloEnd: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
};

function sealTheme(t: RoleTemperature): SealTheme {
  if (t === "impostor") {
    return {
      accent: "var(--color-imp)",
      ring: "color-mix(in srgb, var(--color-imp) 55%, transparent)",
      halo: "color-mix(in srgb, var(--color-imp) 30%, transparent)",
      haloEnd: "color-mix(in srgb, var(--color-imp) 0%, transparent)",
      badgeBorder: "color-mix(in srgb, var(--color-imp) 32%, transparent)",
      badgeBg: "color-mix(in srgb, var(--color-imp) 16%, transparent)",
      badgeText: "var(--color-imp)",
    };
  }
  if (t === "master") {
    return {
      accent: "var(--color-special)",
      ring: "color-mix(in srgb, var(--color-gold) 60%, transparent)",
      halo: "color-mix(in srgb, var(--color-special) 30%, transparent)",
      haloEnd: "color-mix(in srgb, var(--color-special) 0%, transparent)",
      badgeBorder: "color-mix(in srgb, var(--color-gold) 40%, transparent)",
      badgeBg: "color-mix(in srgb, var(--color-special) 16%, transparent)",
      badgeText: "var(--color-gold)",
    };
  }
  return {
    accent: "var(--color-safe)",
    ring: "color-mix(in srgb, var(--color-safe) 50%, transparent)",
    halo: "color-mix(in srgb, var(--color-safe) 26%, transparent)",
    haloEnd: "color-mix(in srgb, var(--color-safe) 0%, transparent)",
    badgeBorder: "color-mix(in srgb, var(--color-safe) 30%, transparent)",
    badgeBg: "color-mix(in srgb, var(--color-safe) 16%, transparent)",
    badgeText: "var(--color-safe)",
  };
}

/* ---- Clearance seal medallion ------------------------------------------ */

function ClearanceSeal({
  Icon,
  theme,
  temperature,
  reduceMotion,
}: {
  Icon: typeof Fingerprint;
  theme: SealTheme;
  temperature: RoleTemperature;
  reduceMotion: boolean;
}) {
  const isImpostor = temperature === "impostor";
  const isMaster = temperature === "master";

  // Slow heartbeat throb for the impostor seal (skipped under reduced motion).
  const throb =
    isImpostor && !reduceMotion
      ? {
          scale: [1, 1.045, 1, 1.06, 1],
          transition: {
            duration: 2.4,
            ease: "easeInOut" as const,
            repeat: Infinity,
            repeatDelay: 0.3,
            times: [0, 0.12, 0.24, 0.36, 1],
          },
        }
      : {};

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: 80, height: 80 }}
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -12 }
      }
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={reduceMotion ? { duration: 0.2 } : { ...SPRING_POP, delay: 0.12 }}
    >
      {/* Radial halo — one pulse on stamp-in. */}
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[var(--r-pill)]"
          style={{
            background: `radial-gradient(circle, ${theme.halo}, ${theme.haloEnd} 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.35, 1.5] }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* Static tonal halo behind the medallion. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[var(--r-pill)] opacity-70"
        style={{
          background: `radial-gradient(circle, ${theme.halo}, ${theme.haloEnd} 72%)`,
        }}
      />

      {/* Throbbing seal body. */}
      <motion.div
        className={cn(
          "relative grid h-20 w-20 place-items-center rounded-[var(--r-pill)] border bg-[var(--glass-2)] shadow-[var(--shadow-md)]",
          isMaster ? "border-2" : "border"
        )}
        style={{ borderColor: theme.ring, color: theme.accent }}
        animate={throb}
      >
        {/* Concentric rings. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-1.5 rounded-[var(--r-pill)] border opacity-50"
          style={{ borderColor: theme.ring }}
        />
        {/* Master gets a ceremonial double-rule. */}
        {isMaster && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-[var(--r-pill)] border opacity-40"
            style={{ borderColor: theme.ring }}
          />
        )}
        <Icon size={isMaster ? 34 : 32} strokeWidth={2} />
      </motion.div>

      {/* Master crown finial — a small gold dot crowning the seal. */}
      {isMaster && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-[var(--r-pill)]"
          style={{
            background: "var(--color-gold)",
            boxShadow: "0 0 10px color-mix(in srgb, var(--color-gold) 70%, transparent)",
          }}
        />
      )}
    </motion.div>
  );
}

/* ---- Title with per-word staggered rise -------------------------------- */

function HeroTitle({
  title,
  accent,
  reduceMotion,
}: {
  title: string;
  accent: string;
  reduceMotion: boolean;
}) {
  const words = useMemo(() => title.split(" "), [title]);

  if (reduceMotion) {
    return (
      <h2
        className="text-center font-display leading-[0.96] text-[var(--color-text)]"
        style={{ fontSize: "clamp(2.4rem, 9vw, 3.4rem)" }}
      >
        {title}
      </h2>
    );
  }

  return (
    <motion.h2
      className="flex flex-wrap items-baseline justify-center gap-x-[0.28em] gap-y-1 text-center font-display leading-[0.96] text-[var(--color-text)]"
      style={{ fontSize: "clamp(2.4rem, 9vw, 3.4rem)" }}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: 0.22 } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 18, rotateX: -40 },
            show: { opacity: 1, y: 0, rotateX: 0, transition: SPRING_POP },
          }}
          style={{
            transformOrigin: "bottom",
            // The trailing word picks up the role accent for emphasis.
            color: i === words.length - 1 ? accent : undefined,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
}

/* ---- The secret slab fused with the hold-to-decrypt button -------------- */

function DecryptSlab({
  label,
  content,
  theme,
  isImpostor,
  isRevealing,
  reduceMotion,
  onDown,
  onUp,
}: {
  label: string;
  content: string;
  theme: SealTheme;
  isImpostor: boolean;
  isRevealing: boolean;
  reduceMotion: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  // Decode the secret letter-by-letter (opacity + scale only — never blur).
  const chars = useMemo(() => Array.from(content), [content]);

  return (
    <div
      className="relative mt-6 overflow-hidden rounded-[var(--r-lg)] border"
      style={{
        borderColor: isRevealing
          ? "color-mix(in srgb, var(--color-info) 55%, transparent)"
          : "var(--w-12)",
        transition: "border-color var(--t-quick) var(--ease-out)",
      }}
    >
      {/* ── Secret display zone (above) ─────────────────────────────── */}
      <div className="relative min-h-[8.5rem] overflow-hidden bg-black/30 shadow-[inset_0_1px_0_var(--w-08)]">
        {/* Eyebrow label for the secret. */}
        <span
          className="absolute left-4 top-3 z-10 font-condensed text-[10px] uppercase tracking-[0.26em]"
          style={{ color: theme.badgeText }}
        >
          {label}
        </span>

        {/* The secret. ALWAYS in the DOM; hidden via opacity+scale ONLY (no
            filter, no remount). Letters decode in per-char on reveal and blank
            quickly on release. select-none + pointer-events-none + aria-hidden
            while hidden so it can't be copied or read out. */}
        <div
          aria-hidden={!isRevealing}
          className={cn(
            "flex min-h-[8.5rem] items-center justify-center px-5 pb-6 pt-9 text-center",
            !isRevealing && "select-none pointer-events-none"
          )}
        >
          <p className="font-display text-3xl leading-tight text-[var(--color-text)] sm:text-4xl">
            {reduceMotion ? (
              <span
                className="transition-opacity duration-[var(--t-base)]"
                style={{ opacity: isRevealing ? 1 : 0 }}
              >
                {content}
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-baseline justify-center">
                {chars.map((ch, i) => (
                  <motion.span
                    key={`${ch}-${i}`}
                    className="inline-block"
                    initial={false}
                    animate={
                      isRevealing
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.4 }
                    }
                    transition={
                      isRevealing
                        ? { ...SPRING_POP, delay: 0.12 + i * 0.02 }
                        : { duration: 0.12, ease: "easeIn" }
                    }
                    style={{ whiteSpace: ch === " " ? "pre" : undefined }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            )}
          </p>
        </div>

        {/* Cyan scan-line sweep while decrypting. */}
        {!reduceMotion && (
          <AnimatePresence>
            {isRevealing && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--color-info), transparent)",
                  boxShadow:
                    "0 0 14px color-mix(in srgb, var(--color-info) 70%, transparent)",
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: ["0%", "13000%"], opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.55,
                  ease: "easeInOut",
                  opacity: { times: [0, 0.1, 0.85, 1], duration: 0.55 },
                }}
              />
            )}
          </AnimatePresence>
        )}

        {/* Locked overlay — fades out (no blur) while held. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2",
            "bg-black/35 transition-opacity duration-[var(--t-base)] ease-[var(--ease-out)]",
            isRevealing ? "opacity-0" : "opacity-100"
          )}
        >
          {/* Fingerprint → eye morph (cross-fade, opacity/scale only). */}
          <span
            className="relative grid h-10 w-10 place-items-center rounded-[var(--r-pill)] border"
            style={{ borderColor: "var(--w-16)", background: "var(--w-08)" }}
          >
            <Fingerprint
              size={18}
              className={cn(
                "absolute text-[var(--text-dim)] transition-[opacity,transform] duration-[var(--t-quick)]",
                isRevealing ? "scale-50 opacity-0" : "scale-100 opacity-100"
              )}
            />
            <Eye
              size={18}
              className={cn(
                "absolute transition-[opacity,transform] duration-[var(--t-quick)]",
                isRevealing ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )}
              style={{ color: "var(--color-info)" }}
            />
          </span>
          <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            Toque para decifrar
          </span>
        </div>
      </div>

      {/* ── The fused hold-button (below, shared radius) ──────────────── */}
      <button
        type="button"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-pressed={isRevealing}
        className={cn(
          "group relative w-full cursor-pointer touch-none select-none overflow-hidden",
          "border-t border-[var(--w-12)] px-5 py-4 text-left text-[var(--color-text)]",
          "transition-[background-color,transform] duration-[var(--t-quick)]",
          "hover:bg-[var(--w-08)] active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
        )}
        style={{
          background: isRevealing
            ? "color-mix(in srgb, var(--color-info) 12%, transparent)"
            : "var(--glass-1)",
        }}
      >
        {/* Hold progress fill. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 rounded-[inherit]",
            isRevealing ? "w-full duration-[550ms]" : "w-0 duration-[var(--t-quick)]"
          )}
          style={{
            background: "color-mix(in srgb, var(--color-info) 16%, transparent)",
            transitionProperty: "width",
            transitionTimingFunction: "var(--ease-out)",
          }}
        />
        <span className="relative flex items-center justify-between gap-4">
          <span>
            <span className="block font-condensed text-[10px] uppercase tracking-[0.26em] text-[var(--text-dim)]">
              {isImpostor ? "Acesso restrito" : "Privado"}
            </span>
            <span className="mt-1 block font-display text-lg sm:text-xl">
              {isRevealing ? "Solte para lacrar" : "Segure para decifrar"}
            </span>
          </span>
          {/* Lock glyph morph: fingerprint → eye. */}
          <span
            className="relative grid h-11 w-11 place-items-center rounded-[var(--r-pill)] border transition-[transform,border-color] duration-[var(--t-quick)] group-hover:scale-105"
            style={{
              borderColor: isRevealing
                ? "color-mix(in srgb, var(--color-info) 55%, transparent)"
                : "var(--w-12)",
              background: isRevealing ? "var(--glass-2)" : "var(--w-08)",
            }}
          >
            <Fingerprint
              size={18}
              className={cn(
                "absolute text-[var(--text-dim)] transition-[opacity,transform] duration-[var(--t-quick)]",
                isRevealing ? "scale-50 opacity-0" : "scale-100 opacity-100"
              )}
            />
            <Eye
              size={18}
              className={cn(
                "absolute transition-[opacity,transform] duration-[var(--t-quick)]",
                isRevealing ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )}
              style={{ color: "var(--color-info)" }}
            />
          </span>
        </span>
      </button>
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
  const [sealing, setSealing] = useState(false);
  const [confettiFire, setConfettiFire] = useState(0);
  const confirmSeen = useMutation(api.rounds.confirmSeen);

  const roleMeta = getRoleMeta(myRole?.role, room.mode);
  const theme = useMemo(
    () => sealTheme(roleMeta.temperature),
    [roleMeta.temperature]
  );
  const SealIcon = roleMeta.icon;

  const isImpostor = myRole?.role === "impostor";
  const hasSecret = Boolean(myRole?.secretContent);
  const showHoldButton = myRole?.role === "player" || (isImpostor && hasSecret);

  const reveal = useCallback(() => setIsRevealing(true), []);
  const hide = useCallback(() => setIsRevealing(false), []);

  const runConfirm = useCallback(() => {
    void confirmSeen({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  }, [confirmSeen, round._id, myPlayer._id, sessionId]);

  const handleConfirm = useCallback(() => {
    if (sealing) return;
    setIsRevealing(false);
    if (reduceMotion) {
      runConfirm();
      return;
    }
    // "Seal shut" micro + gold ring pulse, then commit on settle.
    setSealing(true);
    setConfettiFire((n) => n + 1);
    window.setTimeout(runConfirm, 360);
  }, [sealing, reduceMotion, runConfirm]);

  const secretLabel = isImpostor
    ? room.mode === "word"
      ? "Dica de contexto"
      : "Pergunta do impostor"
    : room.mode === "word"
      ? "Sua palavra secreta"
      : "Sua pergunta";

  const confirmLabel = room.mode === "word" ? "Ja decorei" : "Entendi";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      {/* Tonal ambience behind the dossier. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${theme.halo}, transparent 42%), radial-gradient(circle at 50% 96%, color-mix(in srgb, var(--color-special) 14%, transparent), transparent 40%)`,
        }}
      />

      <motion.div
        // "Envelope opening" — unfolds from the top edge.
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 24, scaleY: 0.86 }
        }
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        transition={reduceMotion ? { duration: 0.25 } : SPRING_GENTLE}
        style={{ transformOrigin: "top center" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Subtle off-axis tilt for the impostor dossier. */}
        <motion.div
          animate={
            isImpostor && !reduceMotion ? { rotate: -1.4 } : { rotate: 0 }
          }
          transition={SPRING_GENTLE}
        >
          {/* Seal-shut micro on confirm + gold ring pulse. */}
          <motion.div
            animate={
              sealing && !reduceMotion
                ? { scaleY: [1, 0.985, 1] }
                : { scaleY: 1 }
            }
            transition={{ duration: 0.36, ease: "easeInOut" }}
            className={cn(
              "glass-panel glass-shell relative overflow-hidden rounded-[var(--r-2xl)]",
              `glass-tone-${roleMeta.tone}`
            )}
          >
            {/* Perforated / torn top edge — dotted rule in glass-border. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-3"
              style={{
                background:
                  "repeating-radial-gradient(circle at 6px 0, var(--glass-border) 0 2.5px, transparent 2.6px 12px)",
                opacity: 0.9,
              }}
            />

            {/* Gold ring pulse on confirm. */}
            {!reduceMotion && (
              <AnimatePresence>
                {sealing && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[var(--r-2xl)]"
                    style={{
                      boxShadow:
                        "inset 0 0 0 2px var(--color-gold), 0 0 28px color-mix(in srgb, var(--color-gold) 45%, transparent)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.95, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>
            )}

            <div className="relative z-10 px-5 pb-6 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
              {/* ── ZONE 1 · HERO IDENTITY ─────────────────────────── */}
              <div className="relative flex flex-col items-center pt-7">
                {/* Confetti origin (gold) on confirm, anchored at the seal. */}
                <span className="pointer-events-none absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2">
                  <Burst
                    fire={confettiFire}
                    colors={[
                      "var(--color-gold)",
                      theme.accent,
                      "var(--color-special)",
                    ]}
                    count={16}
                  />
                </span>

                {/* Clearance seal — half-overlapping the top notch. */}
                <div className="-mt-[3.6rem]">
                  <ClearanceSeal
                    Icon={SealIcon}
                    theme={theme}
                    temperature={roleMeta.temperature}
                    reduceMotion={reduceMotion}
                  />
                </div>

                {/* Tiny eyebrow (status demoted). */}
                <motion.p
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.28, duration: 0.25 }}
                  className="mt-3 font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]"
                >
                  {roleMeta.eyebrow}
                </motion.p>

                {/* Hero title with per-word rise. */}
                <div className="mt-2">
                  <HeroTitle
                    title={roleMeta.title}
                    accent={theme.accent}
                    reduceMotion={reduceMotion}
                  />
                </div>
              </div>

              {/* ── ZONE 2 · QUIET BRIEFING LINE ───────────────────── */}
              <motion.p
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.4, duration: 0.3 }}
                className="mx-auto mt-5 max-w-sm text-center font-body text-sm leading-relaxed text-[var(--color-text-muted)]"
              >
                {roleMeta.briefing}
              </motion.p>

              {/* ── ZONE 3 · THE SECRET ────────────────────────────── */}
              {isImpostor && !hasSecret ? (
                <motion.div
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.46, ...SPRING_GENTLE }}
                  className="glass-section mt-6 rounded-[var(--r-lg)] p-5 text-center"
                >
                  <p
                    className="font-condensed text-[11px] uppercase tracking-[0.24em]"
                    style={{ color: theme.badgeText }}
                  >
                    Sua situacao
                  </p>
                  <p className="mt-3 font-body text-base leading-relaxed text-[var(--color-text)]">
                    {room.mode === "word"
                      ? "Voce nao recebeu a palavra. Leia o clima da mesa, absorva o contexto e blefe com precisao."
                      : "Voce recebeu a pergunta alternativa. Responda como se estivesse totalmente no contexto."}
                  </p>
                </motion.div>
              ) : showHoldButton ? (
                <motion.div
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.46, ...SPRING_GENTLE }}
                >
                  <DecryptSlab
                    label={secretLabel}
                    content={myRole?.secretContent ?? ""}
                    theme={theme}
                    isImpostor={isImpostor}
                    isRevealing={isRevealing}
                    reduceMotion={reduceMotion}
                    onDown={reveal}
                    onUp={hide}
                  />
                  {!isImpostor && room.mode === "word" && (
                    <p className="mt-3 text-center font-body text-xs text-[var(--text-dim)]">
                      Pense em uma pista relacionada. Seja especifico sem
                      entregar demais.
                    </p>
                  )}
                </motion.div>
              ) : (
                // Master / impostor-without-hold: a quiet read-only briefing slab.
                <motion.div
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.46, ...SPRING_GENTLE }}
                  className="glass-section mt-6 rounded-[var(--r-lg)] p-5 text-center"
                >
                  <p className="font-body text-base leading-relaxed text-[var(--color-text)]">
                    {roleMeta.subtitle}
                  </p>
                </motion.div>
              )}

              {/* Confirm — gold-ringed, lifts on hover, presses on tap. */}
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.54, duration: 0.3 }}
              >
                <Button
                  onClick={handleConfirm}
                  disabled={sealing}
                  className="mt-6 h-[54px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold uppercase tracking-wide text-[var(--color-primary-press)] shadow-[var(--shadow-md)] transition-transform duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-white active:scale-[0.96]"
                >
                  {confirmLabel}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

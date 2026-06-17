"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useMutation } from "convex/react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Burst } from "@/components/ui/Burst";
import FormField from "../../FormField";
import PostItBoard from "../../PostItBoard";
import GlassSelect from "../../ui/GlassSelect";
import {
  GlassField,
  GlassPanel,
  GlassSection,
  GlassTextarea,
  glassToneClasses,
} from "../../ui/glass";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { getRoleMeta } from "./roleMeta";
import { Crown, Lock, Shield, ShieldAlert, Sparkles } from "lucide-react";

interface MasterQuestionSetupProps {
  round: SafeRound;
  players: PublicPlayer[];
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

/* ---- The two trap fields are tone-coded: the players' question is the "rede"
   (the net the table answers), the impostor's is the "isca" (the bait). Each
   carries its own accent color + glyph so the master always knows which line
   feeds which side of the trap. -------------------------------------------- */

type TrapField = {
  key: "main" | "impostor";
  eyebrow: string;
  label: string;
  Icon: typeof Shield;
  accent: string; // primary themed token
  glow: string; // focus halo color-mix
  badgeBg: string;
  badgeBorder: string;
};

const TRAP_MAIN: TrapField = {
  key: "main",
  eyebrow: "A rede",
  label: "Pergunta dos jogadores",
  Icon: Shield,
  accent: "var(--color-info)",
  glow: "color-mix(in srgb, var(--color-info) 38%, transparent)",
  badgeBg: "color-mix(in srgb, var(--color-info) 16%, transparent)",
  badgeBorder: "color-mix(in srgb, var(--color-info) 34%, transparent)",
};

const TRAP_IMPOSTOR: TrapField = {
  key: "impostor",
  eyebrow: "A isca",
  label: "Pergunta do impostor",
  Icon: ShieldAlert,
  accent: "var(--color-imp)",
  glow: "color-mix(in srgb, var(--color-imp) 38%, transparent)",
  badgeBg: "color-mix(in srgb, var(--color-imp) 16%, transparent)",
  badgeBorder: "color-mix(in srgb, var(--color-imp) 34%, transparent)",
};

/* ---- A single trap line: tone-coded console row whose glass field grows a
   soft accent glow on focus and shake-validates inline. ------------------- */

function TrapLine({
  field,
  value,
  filled,
  focused,
  error,
  help,
  placeholder,
  reduceMotion,
  index,
  onChange,
  onFocus,
  onBlur,
}: {
  field: TrapField;
  value: string;
  filled: boolean;
  focused: boolean;
  error?: string;
  help: string;
  placeholder: string;
  reduceMotion: boolean;
  index: number;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const fieldId = `master-${field.key}-question`;
  const { Icon } = field;

  return (
    <motion.div
      variants={{
        hidden: reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 16, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: reduceMotion ? { duration: 0.2 } : SPRING_GENTLE,
        },
      }}
      className="relative"
    >
      {/* Focus halo — a soft accent bloom behind the whole line. */}
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 rounded-[var(--r-xl)]"
          style={{ background: field.glow, filter: "blur(12px)" }}
          initial={false}
          animate={{ opacity: focused ? 0.9 : 0, scale: focused ? 1 : 0.96 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <div
        className="relative rounded-[var(--r-lg)] border bg-[var(--w-04)] p-4 transition-[border-color,box-shadow,background-color] duration-[var(--t-quick)] ease-[var(--ease-out)] sm:p-5"
        style={{
          borderColor: focused
            ? field.accent
            : filled
              ? field.badgeBorder
              : "var(--w-08)",
          boxShadow: focused
            ? `inset 0 0 0 1px ${field.accent}, 0 0 0 4px ${field.glow}`
            : "none",
        }}
      >
        <FormField
          label={
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                {/* Tone-coded glyph chip. */}
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--r-sm)] border"
                  style={{
                    borderColor: field.badgeBorder,
                    background: field.badgeBg,
                    color: field.accent,
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="flex flex-col leading-none">
                  <span
                    className="font-condensed text-[9px] uppercase tracking-[0.28em]"
                    style={{ color: field.accent }}
                  >
                    {field.eyebrow}
                  </span>
                  <span className="mt-1 font-condensed text-[11px] uppercase tracking-[0.16em] text-[var(--color-text)] sm:text-xs">
                    {field.label}
                  </span>
                </span>
              </span>

              {/* "Pronta" check tick when the line is filled. */}
              <AnimatePresence>
                {filled && (
                  <motion.span
                    key="ready"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.5, y: -2 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={reduceMotion ? { duration: 0.15 } : SPRING_POP}
                    className="flex items-center gap-1 rounded-[var(--r-pill)] border px-2 py-0.5 font-condensed text-[9px] uppercase tracking-[0.18em]"
                    style={{
                      borderColor: field.badgeBorder,
                      background: field.badgeBg,
                      color: field.accent,
                    }}
                  >
                    <Sparkles size={10} />
                    Pronta
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          }
          htmlFor={fieldId}
          error={error}
          help={help}
          className="gap-2"
        >
          <GlassField className="mt-1 rounded-[var(--r-md)]">
            <GlassTextarea
              id={fieldId}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              aria-invalid={Boolean(error)}
              placeholder={placeholder}
            />
          </GlassField>
        </FormField>
      </div>

      {/* Connective "vs" pip between the two lines — only after the first. */}
      {index === 0 && (
        <div className="pointer-events-none absolute -bottom-[1.35rem] left-1/2 z-10 -translate-x-1/2">
          <span className="grid h-7 w-7 place-items-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] font-condensed text-[9px] uppercase tracking-[0.12em] text-[var(--text-dim)] shadow-[var(--shadow-md)]">
            vs
          </span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * The master's setup screen: two questions (players' + impostor's) plus the
 * impostor pick. Both questions are required; FormField shows inline validation
 * once a field is touched, and submit stays disabled until both are filled.
 *
 * Redesign concept — "o mestre arma a rodada": a ceremonial console where the
 * master crafts the trap (the net + the bait). The submit is a satisfying
 * "selar/armar" beat (gold seal pulse + confetti) before the round fires off.
 */
export function MasterQuestionSetup({
  round,
  players,
  room,
  sessionId,
}: MasterQuestionSetupProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [masterMain, setMasterMain] = useState("");
  const [masterImpostor, setMasterImpostor] = useState("");
  const [selectedImpostor, setSelectedImpostor] = useState("random");
  const [touchedMain, setTouchedMain] = useState(false);
  const [touchedImpostor, setTouchedImpostor] = useState(false);
  // Which line currently owns focus (drives the soft glow). Event-driven only.
  const [focusedField, setFocusedField] = useState<"main" | "impostor" | null>(
    null
  );
  // Transient "arm/seal" flourish state — purely cosmetic, runs on confirm.
  const [sealing, setSealing] = useState(false);
  const [sealBurst, setSealBurst] = useState(0);

  const setMasterQuestions = useMutation(api.rounds.setMasterQuestions);
  const roleMeta = getRoleMeta("master", room.mode);

  // Cleanup ref for the cosmetic seal timer. Cleared on unmount (cleanup only —
  // no setState in the effect body, satisfies the React Compiler lint).
  const sealTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (sealTimerRef.current !== null) clearTimeout(sealTimerRef.current);
    },
    []
  );

  // Master board lives behind the card when no questions exist yet (question mode).
  const showMasterBoardBackground =
    room.mode === "question" && round.questionMain == null;

  const impostorOptions = useMemo(
    () => [
      { value: "random", label: "Aleatorio (Sorteio)" },
      ...players
        .filter(
          (player) =>
            !player.isBot &&
            player._id !== (round.masterId as Id<"players"> | null)
        )
        .map((player) => ({
          value: String(player._id),
          label: player.name,
        })),
    ],
    [players, round.masterId]
  );

  const mainError = !masterMain.trim()
    ? "Escreva a pergunta que os jogadores recebem."
    : undefined;
  const impostorError = !masterImpostor.trim()
    ? "Escreva uma pergunta alternativa para o impostor."
    : undefined;
  const canSubmit = !mainError && !impostorError;

  const mainFilled = Boolean(masterMain.trim());
  const impostorFilled = Boolean(masterImpostor.trim());
  const readyCount = (mainFilled ? 1 : 0) + (impostorFilled ? 1 : 0);

  const handleConfirmQuestions = () => {
    setTouchedMain(true);
    setTouchedImpostor(true);
    if (!canSubmit) return;
    // Fire the mutation immediately — it's fire-and-forget; the phase will
    // transition away on success.
    void setMasterQuestions({
      roundId: round._id,
      sessionId,
      questionMain: masterMain,
      questionImpostor: masterImpostor,
      selectedImpostorId:
        selectedImpostor === "random"
          ? undefined
          : (selectedImpostor as Id<"players">),
    });
    if (reduceMotion) return;
    // "Selar" flourish — gold ring pulse + confetti, cosmetic only.
    setSealing(true);
    setSealBurst((n) => n + 1);
    if (sealTimerRef.current !== null) clearTimeout(sealTimerRef.current);
    sealTimerRef.current = window.setTimeout(() => {
      setSealing(false);
      sealTimerRef.current = null;
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      {showMasterBoardBackground && (
        <PostItBoard
          roomId={round.roomId}
          sessionId={sessionId}
          variant="background"
          allowComposer={false}
        />
      )}

      {/* Ceremonial ambience: gold crown wash above, special bloom below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--color-gold) 16%, transparent), transparent 40%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--color-special) 20%, transparent), transparent 42%)",
        }}
      />

      <motion.div
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0.25 } : SPRING_GENTLE}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Seal-shut micro on confirm. */}
        <motion.div
          animate={
            sealing && !reduceMotion ? { scale: [1, 0.985, 1] } : { scale: 1 }
          }
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <GlassPanel
            tone={roleMeta.tone}
            className="relative overflow-hidden rounded-[var(--r-2xl)] px-5 py-6 sm:px-7 sm:py-8"
          >
            {/* Gold "armado" ring pulse on confirm. */}
            {!reduceMotion && (
              <AnimatePresence>
                {sealing && (
                  <motion.span
                    key="seal-ring"
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 rounded-[var(--r-2xl)]"
                    style={{
                      boxShadow:
                        "inset 0 0 0 2px var(--color-gold), 0 0 32px color-mix(in srgb, var(--color-gold) 48%, transparent)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.95, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>
            )}

            <div className="relative z-10">
              {/* ── HEADER · ceremonial credential ─────────────────────── */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* Crown seal medallion — gold double-rule + crown finial,
                      mirrors the master dossier seal. */}
                  <motion.div
                    className="relative grid h-14 w-14 shrink-0 place-items-center"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.4, rotate: -12 }
                    }
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0.2 }
                        : { ...SPRING_POP, delay: 0.08 }
                    }
                  >
                    {/* Static gold halo. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-1.5 rounded-[var(--r-pill)] opacity-70"
                      style={{
                        background:
                          "radial-gradient(circle, color-mix(in srgb, var(--color-special) 30%, transparent), transparent 72%)",
                      }}
                    />
                    <div
                      className="relative grid h-14 w-14 place-items-center rounded-[var(--r-pill)] border-2 bg-[var(--glass-2)] text-[var(--color-special)] shadow-[var(--shadow-md)]"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--color-gold) 60%, transparent)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-1.5 rounded-[var(--r-pill)] border opacity-40"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--color-gold) 60%, transparent)",
                        }}
                      />
                      <Crown size={24} />
                    </div>
                    {/* Crown finial dot. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-[var(--r-pill)]"
                      style={{
                        background: "var(--color-gold)",
                        boxShadow:
                          "0 0 10px color-mix(in srgb, var(--color-gold) 70%, transparent)",
                      }}
                    />
                  </motion.div>

                  <div>
                    <motion.p
                      initial={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduceMotion ? 0 : 0.18,
                        duration: 0.25,
                      }}
                      className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]"
                    >
                      {roleMeta.accentLabel}
                    </motion.p>
                    <motion.h2
                      initial={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0.2 }
                          : { ...SPRING_POP, delay: 0.22 }
                      }
                      className="mt-1 font-display text-2xl text-[var(--color-text)] sm:text-[2rem]"
                    >
                      {roleMeta.title}
                    </motion.h2>
                  </div>
                </div>

                <div className="self-start rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  Rodada em preparo
                </div>
              </div>

              <motion.p
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.3 }}
                className="mt-5 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base"
              >
                {roleMeta.subtitle}
              </motion.p>

              {/* ── TRAP CONSOLE · the two questions ───────────────────── */}
              <GlassSection className="mt-6 rounded-[var(--r-lg)] p-5 text-left sm:p-6">
                {/* Console eyebrow + progress. */}
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="font-condensed text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
                    Arme a rodada
                  </p>
                  <div className="flex items-center gap-1.5">
                    {[0, 1].map((i) => (
                      <motion.span
                        key={i}
                        aria-hidden
                        animate={{ scale: i < readyCount ? 1 : 0.7 }}
                        transition={
                          reduceMotion ? { duration: 0 } : SPRING_POP
                        }
                        className={cn(
                          "h-1.5 w-5 rounded-[var(--r-pill)] transition-colors duration-[var(--t-quick)]",
                          i < readyCount
                            ? "bg-[var(--color-gold)]"
                            : "bg-[var(--w-16)]"
                        )}
                      />
                    ))}
                    <span className="tnum ml-1 font-condensed text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
                      {readyCount}/2
                    </span>
                  </div>
                </div>

                <motion.div
                  className="grid gap-9"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: {
                        staggerChildren: reduceMotion ? 0 : 0.1,
                        delayChildren: reduceMotion ? 0 : 0.36,
                      },
                    },
                  }}
                >
                  <TrapLine
                    field={TRAP_MAIN}
                    value={masterMain}
                    filled={mainFilled}
                    focused={focusedField === "main"}
                    error={touchedMain ? mainError : undefined}
                    help="Todos respondem a esta, menos o impostor."
                    placeholder="Ex.: Qual resposta parece correta sem ser obvia?"
                    reduceMotion={reduceMotion}
                    index={0}
                    onChange={setMasterMain}
                    onFocus={() => setFocusedField("main")}
                    onBlur={() => {
                      setTouchedMain(true);
                      setFocusedField((f) => (f === "main" ? null : f));
                    }}
                  />

                  <TrapLine
                    field={TRAP_IMPOSTOR}
                    value={masterImpostor}
                    filled={impostorFilled}
                    focused={focusedField === "impostor"}
                    error={touchedImpostor ? impostorError : undefined}
                    help="Diferente, mas capaz de gerar respostas parecidas."
                    placeholder="Crie uma pergunta diferente, mas capaz de gerar resposta parecida."
                    reduceMotion={reduceMotion}
                    index={1}
                    onChange={setMasterImpostor}
                    onFocus={() => setFocusedField("impostor")}
                    onBlur={() => {
                      setTouchedImpostor(true);
                      setFocusedField((f) => (f === "impostor" ? null : f));
                    }}
                  />

                  <motion.div
                    variants={{
                      hidden: reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 16 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: reduceMotion
                          ? { duration: 0.2 }
                          : SPRING_GENTLE,
                      },
                    }}
                  >
                    <FormField
                      label="Quem e o impostor?"
                      htmlFor="master-impostor-select"
                      help="Deixe no sorteio ou escolha alguem da mesa."
                    >
                      <GlassSelect
                        ariaLabel="Selecionar impostor da rodada"
                        value={selectedImpostor}
                        onChange={setSelectedImpostor}
                        options={impostorOptions}
                        tone="special"
                        className="rounded-[var(--r-md)]"
                      />
                    </FormField>
                  </motion.div>
                </motion.div>
              </GlassSection>

              {/* ── SEAL / ARM submit ──────────────────────────────────── */}
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.6, duration: 0.3 }}
                className="relative mt-6"
              >
                {/* Confetti origin (gold/special), anchored over the button. */}
                <span className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
                  <Burst
                    fire={sealBurst}
                    colors={[
                      "var(--color-gold)",
                      "var(--color-special)",
                      "var(--color-imp)",
                    ]}
                    count={18}
                  />
                </span>

                {/* Breathing gold ring behind the armed button (only when ready). */}
                {canSubmit && !reduceMotion && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 rounded-[var(--r-md)]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-gold) 36%, transparent)",
                      filter: "blur(9px)",
                    }}
                    animate={{
                      opacity: [0.3, 0.65, 0.3],
                      scale: [0.99, 1.015, 0.99],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <Button
                  onClick={handleConfirmQuestions}
                  disabled={!canSubmit || sealing}
                  className={cn(
                    "relative z-10 flex h-[54px] w-full items-center justify-center gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold uppercase tracking-wide text-[var(--color-primary-press)] shadow-[var(--shadow-md)] transition-[transform,background-color,box-shadow] duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-white active:scale-[0.96] disabled:translate-y-0 disabled:border-[var(--w-08)] disabled:bg-[var(--w-20)] disabled:text-[var(--text-dim)]",
                    glassToneClasses(roleMeta.tone)
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {sealing ? (
                      <motion.span
                        key="sealed"
                        initial={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.6, rotate: -10 }
                        }
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={reduceMotion ? { duration: 0.15 } : SPRING_POP}
                        className="inline-flex items-center gap-2"
                      >
                        <Lock size={16} />
                        Rodada armada
                      </motion.span>
                    ) : (
                      <motion.span
                        key="confirm"
                        initial={
                          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="inline-flex items-center gap-2"
                      >
                        <Crown size={16} />
                        Confirmar perguntas
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                {/* Helper line under the seal. */}
                <p className="mt-2.5 text-center font-body text-xs text-[var(--text-dim)]">
                  {canSubmit
                    ? "Tudo pronto. Sele a rodada para comecar."
                    : "Preencha as duas perguntas para armar a rodada."}
                </p>
              </motion.div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </div>
  );
}

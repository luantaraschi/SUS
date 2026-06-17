"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Check, Send, BookOpen, PenLine, Users } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../ui/glass";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { Burst } from "@/components/ui/Burst";
import { playSound } from "@/lib/sound";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

const MAX_CHARS = 280;

interface AnsweringPhaseProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
}

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

// Three breathing dots — the "writing" signal for other players in the roster.
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-info)] animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export function AnsweringPhase({
  round,
  myPlayer,
  myRole,
  players,
  room,
  sessionId,
}: AnsweringPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [answer, setAnswer] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitAnswer = useMutation(api.answers.submitAnswer);
  const setTyping = useMutation(api.typing.setTyping);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const typingPlayerIds = useQuery(api.typing.getTypingPlayers, { roomId: round.roomId });

  const hasAnswered = answers?.some((a) => a.playerId === myPlayer._id);
  const isMaster = myPlayer.role === "master";
  const isMasterMode = isMasterQuestionMode(room);
  const charCount = answer.length;
  const overLimit = charCount > MAX_CHARS;
  const nearLimit = charCount > MAX_CHARS * 0.8 && !overLimit;
  const canSubmit = Boolean(answer.trim()) && !overLimit;

  const signalTyping = useCallback(
    (isTyping: boolean) => {
      void setTyping({
        roomId: round.roomId,
        playerId: myPlayer._id,
        sessionId,
        isTyping,
      });
    },
    [myPlayer._id, round.roomId, sessionId, setTyping]
  );

  const handleAnswerChange = useCallback(
    (value: string) => {
      setAnswer(value);
      signalTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => signalTyping(false), 2000);
    },
    [signalTyping]
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!answer.trim() || overLimit) return;
    signalTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    void submitAnswer({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
      answer: answer.trim(),
    });
    playSound("ui.toggle");
  };

  // ── Awaiting state (after answering, or master waiting) ──────────────────
  if (hasAnswered || isMaster) {
    return (
      <AwaitingRoster
        players={players}
        answers={answers}
        typingPlayerIds={typingPlayerIds}
        masterId={round.masterId ?? undefined}
        myRole={myRole}
        isMaster={isMaster}
        reduceMotion={reduceMotion}
      />
    );
  }

  // ── Input state ───────────────────────────────────────────────────────────
  const question =
    isMasterMode
      ? myRole?.secretContent
      : room.mode === "question" && myPlayer.role === "impostor"
        ? round.questionImpostor
        : round.questionMain;

  const isMasterAction = isMasterMode;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-6 sm:py-8">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.2 } : spring.gentle}
        className="w-full"
      >
        {/* Deponent identity row — the player giving testimony. */}
        <ReactionAnchor
          playerId={String(myPlayer._id)}
          className="mb-5 flex flex-col items-center gap-2"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0.2 } : { ...spring.pop, delay: 0.06 }}
          >
            <PlayerAvatar
              name={myPlayer.name}
              avatarSeed={myPlayer.emoji}
              imageUrl={myPlayer.avatarImageUrl}
              size="md"
            />
          </motion.div>
          <motion.p
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.16, duration: 0.25 }}
            className="inline-flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]"
          >
            <PenLine size={11} className="text-[var(--color-info)]" />
            {isMasterAction ? "Você lê a pergunta" : "Seu depoimento"}
          </motion.p>
        </ReactionAnchor>

        <GlassPanel
          tone={isMasterAction ? "special" : "neutral"}
          className="rounded-[var(--r-2xl)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="relative z-10">
            {/* Role badge for master */}
            {isMasterAction && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.2 } : spring.gentle}
                className="mb-4 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-special)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-special)_14%,transparent)] px-3 py-1.5"
              >
                <BookOpen size={13} className="text-[var(--color-special)]" />
                <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-special)]">
                  Modo Mestre — leia a pergunta em voz alta
                </span>
              </motion.div>
            )}

            {/* Hero question — the prompt of the testimony. */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={reduceMotion ? { duration: 0.2 } : { ...spring.gentle, delay: 0.04 }}
            >
              <GlassSection className="relative overflow-hidden rounded-[var(--r-xl)] px-4 py-5 sm:px-5">
                {/* Oversized quote glyph watermark. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[7rem] leading-none text-[var(--w-04)]"
                >
                  &rdquo;
                </span>
                <p className="relative font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                  {isMasterAction ? "Sua pergunta" : "A pergunta"}
                </p>
                {question ? (
                  <p className="relative mt-3 font-display text-xl leading-snug text-[var(--color-text)] sm:text-2xl">
                    {question}
                  </p>
                ) : (
                  <p className="relative mt-3 animate-pulse font-body text-sm text-[var(--text-dim)]">
                    Carregando pergunta...
                  </p>
                )}
              </GlassSection>
            </motion.div>

            {/* Deposition slip — the focal answer input. */}
            {!isMasterAction && (
              <DepositionSlip
                value={answer}
                charCount={charCount}
                overLimit={overLimit}
                nearLimit={nearLimit}
                reduceMotion={reduceMotion}
                onChange={handleAnswerChange}
              />
            )}

            {/* Submit / master CTA */}
            <div className="mt-4">
              {isMasterAction ? (
                <ConfirmReadingButton reduceMotion={reduceMotion} onClick={handleSubmit} />
              ) : (
                <SubmitTestimonyButton
                  canSubmit={canSubmit}
                  reduceMotion={reduceMotion}
                  onClick={handleSubmit}
                />
              )}
            </div>

            {/* Hint about awaiting others */}
            {!isMasterAction && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-body text-xs text-[var(--text-dim)]">
                <Users size={11} className="text-[var(--color-info)]" />
                Após enviar, aguarde os outros jogadores
              </p>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

// ── Deposition slip — focal textarea with focus glow + live counter ─────────
function DepositionSlip({
  value,
  charCount,
  overLimit,
  nearLimit,
  reduceMotion,
  onChange,
}: {
  value: string;
  charCount: number;
  overLimit: boolean;
  nearLimit: boolean;
  reduceMotion: boolean;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const ratio = Math.min(charCount / MAX_CHARS, 1);

  const counterColor = overLimit
    ? "text-[var(--color-imp)]"
    : nearLimit
      ? "text-[var(--color-warn)]"
      : "text-[var(--text-dim)]";

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.2 } : { ...spring.gentle, delay: 0.1 }}
      className="mt-4"
    >
      <div className="relative">
        {/* Focus halo — soft info bloom behind the slip while focused. */}
        {!reduceMotion && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-[var(--r-lg)]"
            style={{
              background: "color-mix(in srgb, var(--color-info) 30%, transparent)",
              filter: "blur(10px)",
            }}
            animate={{ opacity: focused ? 0.7 : 0, scale: focused ? 1 : 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        )}

        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Digite sua resposta..."
            rows={4}
            aria-label="Sua resposta"
            className={cn(
              "w-full resize-none rounded-[var(--r-lg)] border bg-black/20 px-4 py-3.5 pb-9 font-body text-base text-[var(--color-text)] placeholder:text-[var(--text-dim)] outline-none",
              "max-h-[160px] overflow-y-auto",
              "transition-[border-color,box-shadow] duration-[var(--t-quick)]",
              overLimit
                ? "border-[color-mix(in_srgb,var(--color-imp)_55%,transparent)] focus:border-[var(--color-imp)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-imp)_22%,transparent)]"
                : "border-[var(--w-12)] focus:border-[color-mix(in_srgb,var(--color-info)_60%,transparent)] focus:shadow-[var(--ring-focus)]"
            )}
          />

          {/* Live char counter — pops as it crosses the warn/over thresholds. */}
          <motion.span
            key={overLimit ? "over" : nearLimit ? "near" : "ok"}
            initial={reduceMotion ? false : { scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : spring.pop}
            className={cn(
              "pointer-events-none absolute bottom-2.5 right-3 font-condensed text-[11px] tabular-nums transition-colors duration-[var(--t-quick)]",
              counterColor
            )}
          >
            {charCount}/{MAX_CHARS}
          </motion.span>
        </div>

        {/* Fill bar — fingertip-thin progress along the slip's base edge. */}
        <div className="absolute inset-x-3 bottom-2 h-[2px] overflow-hidden rounded-[var(--r-pill)] bg-[var(--w-08)]">
          <motion.span
            aria-hidden
            className={cn(
              "block h-full origin-left rounded-[var(--r-pill)]",
              overLimit
                ? "bg-[var(--color-imp)]"
                : nearLimit
                  ? "bg-[var(--color-warn)]"
                  : "bg-[var(--color-info)]"
            )}
            animate={{ scaleX: ratio }}
            transition={reduceMotion ? { duration: 0.1 } : spring.gentle}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Over-limit nudge. */}
      <AnimatePresence>
        {overLimit && (
          <motion.p
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2 font-condensed text-[11px] uppercase tracking-[0.18em] text-[var(--color-imp)]"
          >
            Resposta longa demais — encurte um pouco
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Submit testimony — paper-plane "send" with a sealing flourish ───────────
function SubmitTestimonyButton({
  canSubmit,
  reduceMotion,
  onClick,
}: {
  canSubmit: boolean;
  reduceMotion: boolean;
  onClick: () => void;
}) {
  // SIGNATURE: a one-shot fly + Burst when the testimony is sent.
  const [sent, setSent] = useState(0);

  const handleClick = () => {
    if (!canSubmit) return;
    if (!reduceMotion) {
      // Schedule outside the click's render path; safe one-shot visual arm.
      window.setTimeout(() => setSent((n) => n + 1), 0);
    }
    onClick();
  };

  return (
    <motion.div
      className="relative"
      whileHover={canSubmit && !reduceMotion ? { y: -2 } : undefined}
      transition={spring.press}
    >
      {/* Sealing burst, anchored at the button center. */}
      <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <Burst fire={sent} colors={["var(--color-info)", "var(--color-safe)", "var(--color-gold)"]} count={14} />
      </span>

      <Button
        onClick={handleClick}
        disabled={!canSubmit}
        className={cn(
          "relative h-[54px] w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)]",
          "transition-[transform,background-color] duration-[var(--t-quick)]",
          "hover:bg-white active:scale-[0.96]",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <span className="relative inline-flex items-center gap-2">
          {/* Paper-plane that flies up and away each time a testimony is sent. */}
          <AnimatePresence mode="wait" initial={false}>
            {sent > 0 ? (
              <motion.span
                key={`plane-${sent}`}
                initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: 16, y: -26, rotate: -20 }
                }
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-flex"
              >
                <Send size={16} />
              </motion.span>
            ) : (
              <motion.span
                key="send"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                <Send size={16} />
              </motion.span>
            )}
          </AnimatePresence>
          Enviar resposta
        </span>
      </Button>
    </motion.div>
  );
}

// ── Master variant — ceremonial "Confirmar leitura" (special tone) ──────────
function ConfirmReadingButton({
  reduceMotion,
  onClick,
}: {
  reduceMotion: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="relative"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={spring.press}
    >
      {/* Breathing special halo — distinguishes the master affordance. */}
      {!reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[var(--r-md)]"
          style={{
            background: "color-mix(in srgb, var(--color-special) 40%, transparent)",
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.99, 1.02, 0.99] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <Button
        onClick={onClick}
        className={cn(
          "relative h-[54px] w-full rounded-[var(--r-md)] text-[15px] font-semibold",
          "border border-[color-mix(in_srgb,var(--color-special)_36%,transparent)]",
          "bg-[color-mix(in_srgb,var(--color-special)_20%,transparent)] text-[var(--color-special)]",
          "hover:bg-[color-mix(in_srgb,var(--color-special)_28%,transparent)]",
          "transition-[transform,background-color] duration-[var(--t-quick)]",
          "active:scale-[0.96]"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <BookOpen size={16} />
          Confirmar leitura
        </span>
      </Button>
    </motion.div>
  );
}

// ── Awaiting roster — lively who-has/hasn't-answered board ───────────────────
function AwaitingRoster({
  players,
  answers,
  typingPlayerIds,
  masterId,
  myRole,
  isMaster,
  reduceMotion,
}: {
  players: PublicPlayer[];
  answers: { playerId: Doc<"players">["_id"] }[] | undefined;
  typingPlayerIds: Doc<"players">["_id"][] | undefined;
  masterId: Doc<"players">["_id"] | undefined;
  myRole?: RoleView;
  isMaster: boolean;
  reduceMotion: boolean;
}) {
  const roster = useMemo(
    () => players.filter((p) => !p.isBot && p._id !== masterId),
    [players, masterId]
  );
  const answeredCount = roster.filter((p) =>
    answers?.some((a) => a.playerId === p._id)
  ).length;
  const total = roster.length;
  const allIn = total > 0 && answeredCount >= total;

  // Monotonic burst counter — fires once when allIn first becomes true,
  // resets when allIn goes false so it can re-arm if the game resets.
  const [rosterBurst, setRosterBurst] = useState(0);
  const rosterFiredRef = useRef(false);
  useEffect(() => {
    if (allIn && !rosterFiredRef.current) {
      rosterFiredRef.current = true;
      window.setTimeout(() => setRosterBurst((n) => n + 1), 0);
    } else if (!allIn) {
      rosterFiredRef.current = false;
    }
  }, [allIn]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0.25 } : spring.gentle}
        className="w-full"
      >
        <GlassPanel
          tone={isMaster && !allIn ? "special" : "safe"}
          className="relative overflow-hidden rounded-[var(--r-2xl)] px-5 py-6 sm:px-7 sm:py-8"
        >
          {/* Completion celebration — one-shot when the table fills. */}
          <span className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center">
            <Burst
              fire={rosterBurst}
              colors={["var(--color-safe)", "var(--color-gold)"]}
              count={18}
            />
          </span>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={reduceMotion ? { duration: 0.2 } : { ...spring.pop, delay: 0.08 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_16%,transparent)]"
              >
                <Check size={20} className="text-[var(--color-safe)]" />
              </motion.div>
              <div>
                <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                  {isMaster ? "Mestre" : "Resposta enviada"}
                </p>
                <h2 className="font-display text-2xl text-[var(--color-text)]">
                  Aguardando todos responderem
                </h2>
              </div>
            </div>

            <p className="mt-3 font-body text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isMaster
                ? "Você está aguardando os jogadores responderem a pergunta."
                : "Sua resposta foi registrada. Aguarde os outros jogadores terminarem."}
            </p>

            {/* Progress strip — animated tally of who has answered. */}
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  Depoimentos
                </span>
                <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={answeredCount}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      transition={reduceMotion ? { duration: 0.12 } : spring.pop}
                      className="tnum inline-block text-[var(--color-text)]"
                    >
                      {answeredCount}
                    </motion.span>
                  </AnimatePresence>
                  /<span className="tnum">{total}</span>
                </span>
              </div>
              <div className="flex w-full gap-1">
                {Array.from({ length: Math.max(total, 1) }).map((_, i) => {
                  const filled = i < answeredCount;
                  return (
                    <div
                      key={i}
                      className="relative h-2 flex-1 overflow-hidden rounded-[var(--r-pill)] bg-[var(--w-08)]"
                    >
                      <motion.span
                        aria-hidden
                        initial={false}
                        animate={{ scaleX: filled ? 1 : 0 }}
                        transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                        className="absolute inset-0 origin-left rounded-[var(--r-pill)] bg-[var(--color-safe)]"
                        style={
                          filled
                            ? { boxShadow: "0 0 10px color-mix(in srgb, var(--color-safe) 55%, transparent)" }
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Player grid */}
            <GlassSection className="mt-5 rounded-[var(--r-xl)] p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                {roster.map((player, index) => {
                  const answered = answers?.some((a) => a.playerId === player._id);
                  const isMarkedByMaster =
                    myRole?.role === "master" &&
                    myRole.masterImpostorIds?.includes(player._id);
                  const isPlayerTyping =
                    !answered && typingPlayerIds?.includes(player._id);

                  return (
                    <ReactionAnchor
                      key={player._id}
                      playerId={String(player._id)}
                      className="flex flex-col items-center text-center"
                    >
                      <motion.div
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0.2 }
                            : { ...spring.gentle, delay: index * 0.04 }
                        }
                        className={cn(
                          "relative flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] border transition-[border-color,background-color] duration-[var(--t-base)]",
                          answered
                            ? "border-[color-mix(in_srgb,var(--color-safe)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
                            : isPlayerTyping
                              ? "border-[color-mix(in_srgb,var(--color-info)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)]"
                              : "border-[var(--w-12)] bg-[var(--glass-1)]"
                        )}
                      >
                        {/* Soft writing pulse on actively-typing players. */}
                        {isPlayerTyping && !reduceMotion && (
                          <motion.span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-[var(--r-lg)]"
                            style={{
                              boxShadow:
                                "0 0 0 2px color-mix(in srgb, var(--color-info) 35%, transparent)",
                            }}
                            animate={{ opacity: [0.4, 0.9, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}

                        <PlayerAvatar
                          name={player.name}
                          avatarSeed={player.emoji}
                          imageUrl={player.avatarImageUrl}
                          size="sm"
                          hideName
                        />

                        <AnimatePresence mode="wait">
                          {answered ? (
                            <motion.div
                              key="check"
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -12 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0 }}
                              transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                              className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-safe)] shadow-[var(--shadow-sm)]"
                            >
                              <Check size={11} strokeWidth={3} className="text-black" />
                            </motion.div>
                          ) : isPlayerTyping ? (
                            <motion.div
                              key="typing"
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={reduceMotion ? { duration: 0.15 } : spring.pop}
                              className="absolute -bottom-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-info)_85%,black)] px-1 shadow-[var(--shadow-sm)]"
                            >
                              <TypingDots />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="waiting"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0.4, 0.9, 0.4] }}
                              exit={{ opacity: 0 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0.2 }
                                  : { repeat: Infinity, duration: 2, ease: "easeInOut" }
                              }
                              className="absolute -top-1.5 -right-1.5 text-sm"
                              aria-hidden
                            >
                              ⏳
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <p className="mt-2 flex w-14 items-center justify-center gap-1 truncate font-condensed text-[11px] text-[var(--color-text-muted)]">
                        {player.name}
                        {isMarkedByMaster && (
                          <span className="text-[10px] text-[var(--color-imp)]" title="Impostor">
                            🤡
                          </span>
                        )}
                      </p>
                    </ReactionAnchor>
                  );
                })}
              </div>
            </GlassSection>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

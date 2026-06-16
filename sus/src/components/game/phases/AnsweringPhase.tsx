"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, Send, BookOpen } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../ui/glass";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
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

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      <span
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-info)] animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-info)] animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[var(--color-info)] animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
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
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <GlassPanel tone="safe" className="rounded-[var(--r-2xl)] px-5 py-6 sm:px-7 sm:py-8">
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-safe)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_16%,transparent)]">
                  <Check size={20} className="text-[var(--color-safe)]" />
                </div>
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

              {/* Player grid */}
              <GlassSection className="mt-5 rounded-[var(--r-xl)] p-4 sm:p-5">
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {players
                    .filter(
                      (p) => !p.isBot && p._id !== (round.masterId ?? undefined)
                    )
                    .map((player) => {
                      const answered = answers?.some((a) => a.playerId === player._id);
                      const isMarkedByMaster =
                        myRole?.role === "master" &&
                        myRole.masterImpostorIds?.includes(player._id);
                      const isPlayerTyping = !answered && typingPlayerIds?.includes(player._id);

                      return (
                        <ReactionAnchor
                          key={player._id}
                          playerId={String(player._id)}
                          className="flex flex-col items-center text-center"
                        >
                          <div
                            className={cn(
                              "relative flex h-14 w-14 items-center justify-center rounded-[var(--r-lg)] border transition-[border-color,background-color] duration-[var(--t-base)]",
                              answered
                                ? "border-[color-mix(in_srgb,var(--color-safe)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-safe)_12%,transparent)]"
                                : "border-[var(--w-12)] bg-[var(--glass-1)]"
                            )}
                          >
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
                                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={spring.pop}
                                  className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-safe)] shadow-[var(--shadow-sm)]"
                                >
                                  <Check size={11} className="text-black" />
                                </motion.div>
                              ) : isPlayerTyping ? (
                                <motion.div
                                  key="typing"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-info)_80%,black)] shadow-[var(--shadow-sm)]"
                                >
                                  <TypingDots />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="waiting"
                                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                  className="absolute -top-1.5 -right-1.5 text-sm"
                                  aria-hidden
                                >
                                  ⏳
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
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
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        {/* Player avatar row */}
        <ReactionAnchor
          playerId={String(myPlayer._id)}
          className="mb-5 flex flex-col items-center"
        >
          <PlayerAvatar
            name={myPlayer.name}
            avatarSeed={myPlayer.emoji}
            imageUrl={myPlayer.avatarImageUrl}
            size="md"
          />
        </ReactionAnchor>

        <GlassPanel
          tone={isMasterAction ? "special" : "neutral"}
          className="rounded-[var(--r-2xl)] px-5 py-6 sm:px-6 sm:py-7"
        >
          <div className="relative z-10">
            {/* Role badge for master */}
            {isMasterAction && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--color-special)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-special)_14%,transparent)] px-3 py-1.5">
                <BookOpen size={13} className="text-[var(--color-special)]" />
                <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--color-special)]">
                  Modo Mestre — leia a pergunta em voz alta
                </span>
              </div>
            )}

            {/* Question */}
            <GlassSection className="rounded-[var(--r-xl)] px-4 py-5 sm:px-5">
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                {isMasterAction ? "Sua pergunta" : "Pergunta"}
              </p>
              <p className="mt-3 font-display text-xl leading-snug text-[var(--color-text)] sm:text-2xl">
                {question}
              </p>
            </GlassSection>

            {/* Textarea + char counter — scrollable so the button stays visible */}
            {!isMasterAction && (
              <div className="mt-4">
                <div className="relative">
                  <textarea
                    value={answer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={4}
                    className={cn(
                      "w-full resize-none rounded-[var(--r-lg)] border bg-black/20 px-4 py-3.5 pb-8 font-body text-base text-[var(--color-text)] placeholder:text-[var(--text-dim)] outline-none",
                      "max-h-[160px] overflow-y-auto",
                      "transition-[border-color,box-shadow] duration-[var(--t-quick)]",
                      "focus:shadow-[var(--ring-focus)]",
                      overLimit
                        ? "border-[color-mix(in_srgb,var(--color-imp)_50%,transparent)] focus:border-[var(--color-imp)]"
                        : "border-[var(--w-12)] focus:border-[color-mix(in_srgb,var(--color-info)_60%,transparent)]"
                    )}
                  />
                  {/* Char counter — pinned to bottom-right of textarea */}
                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-2.5 right-3 font-condensed text-[11px] tabular-nums transition-colors duration-[var(--t-quick)]",
                      overLimit
                        ? "text-[var(--color-imp)]"
                        : charCount > MAX_CHARS * 0.8
                          ? "text-[var(--color-warn)]"
                          : "text-[var(--text-dim)]"
                    )}
                  >
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            )}

            {/* Submit / master CTA */}
            <div className="mt-4">
              {isMasterAction ? (
                <Button
                  onClick={handleSubmit}
                  className={cn(
                    "h-[52px] w-full rounded-[var(--r-md)] text-[15px] font-semibold",
                    "border border-[color-mix(in_srgb,var(--color-special)_30%,transparent)]",
                    "bg-[color-mix(in_srgb,var(--color-special)_18%,transparent)] text-[var(--color-special)]",
                    "hover:bg-[color-mix(in_srgb,var(--color-special)_28%,transparent)]",
                    "transition-[transform,background-color] duration-[var(--t-quick)]",
                    "hover:-translate-y-0.5 active:scale-[0.98]"
                  )}
                >
                  <BookOpen size={16} />
                  Confirmar leitura
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || overLimit}
                  className={cn(
                    "h-[52px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)]",
                    "transition-[transform,background-color] duration-[var(--t-quick)]",
                    "hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]",
                    "disabled:pointer-events-none disabled:opacity-40"
                  )}
                >
                  <Send size={16} />
                  Enviar resposta
                </Button>
              )}
            </div>

            {/* Hint about awaiting others */}
            {!isMasterAction && (
              <p className="mt-3 text-center font-body text-xs text-[var(--text-dim)]">
                <Clock size={11} className="mr-1 inline-block" />
                Após enviar, aguarde os outros jogadores
              </p>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

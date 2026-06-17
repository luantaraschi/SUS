"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Burst } from "@/components/ui/Burst";
import { spring, staggerContainer, staggerItem } from "@/lib/motion";
import { playSound } from "@/lib/sound";

const QUICK_EMOJIS = [
  "\u{1F440}",
  "\u{1F921}",
  "\u{1F47B}",
  "\u{1F525}",
  "\u{1F480}",
  "\u{1F602}",
];

// Drawer springs out of the FAB corner, so it should grow from bottom-right.
const drawerOrigin = { transformOrigin: "bottom right" } as const;

interface FloatingChatProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  sessionId: string;
}

export default function FloatingChat({
  roomId,
  playerId,
  sessionId,
}: FloatingChatProps) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reaction feedback: a counter bumps to replay the keyed emoji-puff + Burst
  // from whichever quick-emoji was just tapped (no effect/setState-in-effect).
  const [puff, setPuff] = useState<{ key: number; emoji: string }>({
    key: 0,
    emoji: QUICK_EMOJIS[0],
  });
  // Sent flourish: bumps each time a text message lands to replay the morph.
  const [sentKey, setSentKey] = useState(0);

  const sendMessage = useMutation(api.chat.sendMessage);
  // Busy-guard: prevents a rapid double-Enter from firing two identical mutations
  // before setText("") propagates through the React render cycle.
  const sendingRef = useRef(false);

  const handleSend = useCallback(
    (messageText: string, isEmoji: boolean) => {
      const trimmed = messageText.trim();
      if (!trimmed) {
        return;
      }

      void sendMessage({
        roomId,
        playerId,
        sessionId,
        text: trimmed,
        isEmoji,
      });
      playSound("chat.message");
      setText("");
    },
    [playerId, roomId, sendMessage, sessionId]
  );

  const handleEmojiSend = useCallback(
    (emoji: string) => {
      handleSend(emoji, true);
      // Fire the delightful per-button reaction puff + spark.
      setPuff((prev) => ({ key: prev.key + 1, emoji }));
    },
    [handleSend]
  );

  const handleTextSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) {
      return;
    }
    sendingRef.current = true;
    // Clear input immediately so a second Enter before re-render is a no-op.
    setText("");
    handleSend(trimmed, false);
    sendingRef.current = false;
    // Replay the "sent" flourish on the plane button.
    setSentKey((k) => k + 1);
  }, [handleSend, text]);

  const canSendText = Boolean(text.trim());

  return (
    <div className="fixed bottom-24 right-4 z-[46] flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.86 }}
            transition={reduce ? { duration: 0.14 } : spring.pop}
            style={drawerOrigin}
            className="relative flex w-64 flex-col gap-2.5 overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-3 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-md)]"
          >
            {/* Staggered interior so the panel "assembles" as it springs in. */}
            <motion.div
              variants={reduce ? undefined : staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-col gap-2.5"
            >
              {/* Eyebrow: live "transmissao" badge with a pulsing dot. */}
              <motion.div
                variants={reduce ? undefined : staggerItem}
                transition={spring.gentle}
                className="flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  <span className="relative flex h-2 w-2">
                    {!reduce && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: "var(--color-special)" }}
                        animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--color-special)" }}
                    />
                  </span>
                  Transmissao
                </span>
              </motion.div>

              {/* Quick emoji reactions — hover scale, press pop, send puff. */}
              <motion.div
                variants={reduce ? undefined : staggerItem}
                transition={spring.gentle}
                className="flex justify-between gap-1"
              >
                {QUICK_EMOJIS.map((emoji) => (
                  <div key={emoji} className="relative">
                    {/* Per-emoji reaction layer: the tapped emoji puffs upward
                        and a small spark Burst fires, both keyed off `puff`. */}
                    {puff.emoji === emoji && (
                      <>
                        <Burst
                          fire={puff.key}
                          count={7}
                          colors={[
                            "var(--color-special)",
                            "var(--color-gold)",
                            "var(--color-info)",
                          ]}
                        />
                        {!reduce && (
                          <AnimatePresence>
                            <motion.span
                              key={puff.key}
                              aria-hidden
                              className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg"
                              initial={{ opacity: 0.95, y: 0, scale: 1 }}
                              animate={{ opacity: 0, y: -34, scale: 1.5 }}
                              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                            >
                              {emoji}
                            </motion.span>
                          </AnimatePresence>
                        )}
                      </>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => handleEmojiSend(emoji)}
                      whileHover={reduce ? undefined : { scale: 1.18, y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.88 }}
                      transition={spring.pop}
                      aria-label={`Enviar reacao ${emoji}`}
                      className="relative flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] text-lg outline-none transition-[background-color] duration-[var(--t-quick)] hover:bg-[color-mix(in_srgb,var(--color-special)_22%,var(--glass-2))] focus-visible:shadow-[var(--ring-focus)]"
                    >
                      {emoji}
                    </motion.button>
                  </div>
                ))}
              </motion.div>

              {/* Text line with focus glow + animated send flourish. */}
              <motion.form
                variants={reduce ? undefined : staggerItem}
                transition={spring.gentle}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleTextSubmit();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  {/* Focus glow — fades in around the field while typing. */}
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute -inset-[2px] rounded-[var(--r-pill)]"
                    initial={false}
                    animate={{
                      opacity: inputFocused ? 1 : 0,
                      boxShadow: inputFocused
                        ? "0 0 0 2px color-mix(in srgb, var(--color-special) 55%, transparent), 0 0 18px color-mix(in srgb, var(--color-special) 32%, transparent)"
                        : "0 0 0 0 transparent",
                    }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(event) => setText(event.target.value.slice(0, 100))}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Mensagem..."
                    maxLength={100}
                    className="relative h-11 w-full rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--text-dim)]"
                  />
                </div>
                <div className="relative shrink-0">
                  {/* Sent spark — fires from the plane each time text lands. */}
                  <Burst
                    fire={sentKey}
                    count={8}
                    colors={["var(--color-special)", "var(--color-info)"]}
                  />
                  <motion.button
                    type="submit"
                    disabled={!canSendText}
                    whileHover={reduce || !canSendText ? undefined : { scale: 1.08, y: -1 }}
                    whileTap={reduce || !canSendText ? undefined : { scale: 0.9 }}
                    transition={spring.pop}
                    aria-label="Enviar mensagem"
                    className="flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-special)] text-white shadow-[var(--shadow-sm)] outline-none transition-[opacity,filter] duration-[var(--t-quick)] hover:enabled:brightness-110 disabled:opacity-40 focus-visible:shadow-[var(--ring-focus)]"
                  >
                    {/* Plane lifts off on each send (keyed off sentKey). */}
                    <motion.span
                      key={sentKey}
                      className="inline-flex"
                      initial={
                        reduce || sentKey === 0
                          ? false
                          : { x: -6, y: 6, rotate: -18, opacity: 0 }
                      }
                      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                      transition={spring.pop}
                    >
                      <Icon icon="solar:plain-bold" width={16} height={16} />
                    </motion.span>
                  </motion.button>
                </div>
              </motion.form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — morphing chat/close icon, idle breathing, "live" invite ring. */}
      <motion.button
        type="button"
        onClick={() => {
          setExpanded((prev) => !prev);
          if (!expanded) {
            window.setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        whileHover={reduce ? undefined : { scale: 1.06 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={spring.press}
        aria-label={expanded ? "Fechar transmissao" : "Abrir transmissao"}
        aria-expanded={expanded}
        className="relative flex h-12 w-12 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-md)] outline-none focus-visible:shadow-[var(--ring-focus)]"
      >
        {/* Invite ring — gently pulses only while the drawer is closed. */}
        {!reduce && !expanded && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[var(--r-pill)]"
            style={{
              boxShadow: "0 0 0 2px color-mix(in srgb, var(--color-special) 60%, transparent)",
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={expanded ? "close" : "chat"}
            className="inline-flex"
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
            transition={reduce ? { duration: 0.12 } : spring.pop}
          >
            <Icon
              icon={
                expanded
                  ? "solar:close-circle-bold"
                  : "solar:chat-round-dots-bold"
              }
              width={22}
              height={22}
            />
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

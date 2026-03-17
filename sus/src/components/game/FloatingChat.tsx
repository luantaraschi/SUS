"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import PlayerAvatar from "./PlayerAvatar";
import { Icon } from "@iconify/react";

const QUICK_EMOJIS = ["👀", "🤡", "🧢", "🔥", "💀", "😂"];
const BUBBLE_LIFETIME_MS = 3000;

interface FloatingChatProps {
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  sessionId: string;
}

interface VisibleBubble {
  id: string;
  playerName: string;
  playerEmoji: string;
  text: string;
  isEmoji: boolean;
  sentAt: number;
}

export default function FloatingChat({
  roomId,
  playerId,
  sessionId,
}: FloatingChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [bubbles, setBubbles] = useState<VisibleBubble[]>([]);
  const seenIds = useRef(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(api.chat.getRecentMessages, { roomId });
  const sendMessage = useMutation(api.chat.sendMessage);

  // Track new messages and create bubbles
  useEffect(() => {
    if (!messages) return;
    const now = Date.now();
    const newBubbles: VisibleBubble[] = [];

    for (const msg of messages) {
      if (seenIds.current.has(msg._id)) continue;
      if (now - msg.sentAt > BUBBLE_LIFETIME_MS) continue;
      seenIds.current.add(msg._id);
      newBubbles.push({
        id: msg._id,
        playerName: msg.playerName,
        playerEmoji: msg.playerEmoji,
        text: msg.text,
        isEmoji: msg.isEmoji,
        sentAt: msg.sentAt,
      });
    }

    if (newBubbles.length > 0) {
      setBubbles((prev) => [...prev, ...newBubbles]);
    }
  }, [messages]);

  // Auto-remove bubbles after lifetime
  useEffect(() => {
    if (bubbles.length === 0) return;
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - BUBBLE_LIFETIME_MS;
      setBubbles((prev) => prev.filter((b) => b.sentAt > cutoff));
    }, 500);
    return () => window.clearInterval(timer);
  }, [bubbles.length]);

  const handleSend = useCallback(
    (messageText: string, isEmoji: boolean) => {
      const trimmed = messageText.trim();
      if (!trimmed) return;
      void sendMessage({
        roomId,
        playerId,
        sessionId,
        text: trimmed,
        isEmoji,
      });
      setText("");
    },
    [playerId, roomId, sendMessage, sessionId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(text, false);
  };

  return (
    <>
      {/* Floating bubbles overlay */}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[45] flex flex-col-reverse items-end gap-2 px-4">
        <AnimatePresence>
          {bubbles.slice(-5).map((bubble) => (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none flex items-center gap-2 rounded-2xl bg-black/70 px-3 py-2 shadow-lg backdrop-blur-sm"
            >
              <PlayerAvatar
                name={bubble.playerName}
                avatarSeed={bubble.playerEmoji}
                size="sm"
                hideName
              />
              <div className="flex flex-col">
                <span className="font-condensed text-[10px] uppercase tracking-wider text-white/50">
                  {bubble.playerName}
                </span>
                <span
                  className={`font-body ${bubble.isEmoji ? "text-2xl" : "text-sm text-white"}`}
                >
                  {bubble.text}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat toggle + input panel */}
      <div className="fixed bottom-24 right-4 z-[46] flex flex-col items-end gap-2">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex w-64 flex-col gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-md"
            >
              {/* Quick emojis */}
              <div className="flex justify-center gap-1.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSend(emoji, true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Text input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 100))}
                  placeholder="Mensagem..."
                  maxLength={100}
                  className="h-9 flex-1 rounded-full border border-white/20 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-primary text-white transition-transform hover:scale-105 disabled:opacity-40"
                >
                  <Icon icon="solar:plain-bold" width={16} height={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => {
            setExpanded((prev) => !prev);
            if (!expanded) {
              window.setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          <Icon
            icon={expanded ? "solar:close-circle-bold" : "solar:chat-round-dots-bold"}
            width={22}
            height={22}
          />
        </button>
      </div>
    </>
  );
}

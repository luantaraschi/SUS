"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const QUICK_EMOJIS = [
  "\u{1F440}",
  "\u{1F921}",
  "\u{1F47B}",
  "\u{1F525}",
  "\u{1F480}",
  "\u{1F602}",
];

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
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useMutation(api.chat.sendMessage);

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
      setText("");
    },
    [playerId, roomId, sendMessage, sessionId]
  );

  return (
    <div className="fixed bottom-24 right-4 z-[46] flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="flex w-64 flex-col gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-md"
          >
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

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(text, false);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 100))}
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
  );
}

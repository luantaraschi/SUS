"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Icon } from "@iconify/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type PostItColor = "butter" | "mint" | "sky" | "peach";

const POST_IT_COLORS: PostItColor[] = ["butter", "mint", "sky", "peach"];

const POST_IT_STYLES: Record<
  PostItColor,
  { background: string; color: string; borderColor: string }
> = {
  butter: {
    background: "rgba(255, 243, 166, 0.94)",
    color: "#5c4700",
    borderColor: "rgba(201, 167, 58, 0.45)",
  },
  mint: {
    background: "rgba(201, 255, 223, 0.94)",
    color: "#14462f",
    borderColor: "rgba(53, 143, 93, 0.34)",
  },
  sky: {
    background: "rgba(198, 244, 255, 0.95)",
    color: "#0f3854",
    borderColor: "rgba(41, 129, 161, 0.34)",
  },
  peach: {
    background: "rgba(255, 222, 194, 0.95)",
    color: "#5f3419",
    borderColor: "rgba(174, 102, 52, 0.34)",
  },
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandomColor() {
  return POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)]!;
}

interface PostItBoardProps {
  roomId: Id<"rooms">;
  sessionId: string;
  variant?: "interactive" | "background";
  allowComposer?: boolean;
  className?: string;
}

export default function PostItBoard({
  roomId,
  sessionId,
  variant = "interactive",
  allowComposer = variant === "interactive",
  className = "",
}: PostItBoardProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const messages = useQuery(api.lobbyMessages.getLobbyMessages, { roomId });
  const sendLobbyMessage = useMutation(api.lobbyMessages.sendLobbyMessage);

  const orderedMessages = useMemo(
    () =>
      [...(messages ?? [])].sort((left, right) => left.createdAt - right.createdAt),
    [messages]
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      await sendLobbyMessage({
        roomId,
        sessionId,
        text: trimmed,
        x: randomBetween(6, 78),
        y: randomBetween(8, 64),
        rotation: randomBetween(-6, 6),
        color: pickRandomColor(),
      });
      setText("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Nao foi possivel enviar o recado.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${
        variant === "background" ? "pointer-events-none" : ""
      } ${className}`}
    >
      <div
        className={`absolute inset-0 ${
          variant === "background" ? "bg-black/15" : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%)]"
        }`}
      />
      <div className={`absolute inset-0 ${variant === "background" ? "opacity-65" : ""}`}>
        {orderedMessages.map((message, index) => {
          const paperStyle = POST_IT_STYLES[message.color];

          return (
            <div
              key={message._id}
              className="post-it-paper absolute flex min-h-[104px] w-[152px] max-w-[38vw] select-none items-center justify-center rounded-[18px] border px-4 py-4 text-center text-sm leading-snug md:w-[176px] md:text-[15px]"
              style={{
                left: `${message.x}%`,
                top: `${message.y}%`,
                transform: `translate(-50%, -50%) rotate(${message.rotation}deg)`,
                background: paperStyle.background,
                borderColor: paperStyle.borderColor,
                color: paperStyle.color,
                zIndex: index + 1,
              }}
            >
              <span className="font-hand text-[15px] leading-snug md:text-base">
                {message.text}
              </span>
            </div>
          );
        })}
      </div>

      {allowComposer && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-2">
            <div className="flex items-center gap-2 rounded-[28px] border border-white/14 bg-black/55 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md">
              <input
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 60))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Deixe um recado anonimo..."
                maxLength={60}
                className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-4 font-body text-sm text-white outline-none placeholder:text-white/45 focus:border-white/35"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!text.trim() || isSending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1f1651] shadow-sm transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Icon icon="solar:plain-bold" width={18} height={18} />
              </button>
            </div>
            {error && (
              <p className="text-center font-body text-xs text-[#ffd4de]">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

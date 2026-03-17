"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

const REACTION_LIFETIME_MS = 3000;

type ChatReaction = {
  _id: Id<"chatMessages">;
  playerId: Id<"players">;
  playerName: string;
  text: string;
  isEmoji: boolean;
  sentAt: number;
};

type ReactionMeta = {
  drift: number;
  sway: number;
  rise: number;
  durationMs: number;
  scale: number;
  tilt: number;
};

type VisibleReaction = ChatReaction & {
  meta: ReactionMeta;
};

type ReactionContextValue = {
  fallbackReactions: VisibleReaction[];
  getReactionsForPlayer: (playerId: string) => VisibleReaction[];
  registerAnchor: (playerId: string) => void;
  unregisterAnchor: (playerId: string) => void;
};

const ReactionContext = createContext<ReactionContextValue | null>(null);

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mapHashToRange(seed: number, min: number, max: number) {
  const normalized = (seed % 10000) / 10000;
  return min + (max - min) * normalized;
}

function createReactionMeta(reaction: ChatReaction): ReactionMeta {
  const baseSeed = hashString(
    `${reaction._id}:${reaction.playerId}:${reaction.sentAt}:${reaction.text}`
  );

  return {
    drift: mapHashToRange(baseSeed + 17, -20, 20),
    sway: mapHashToRange(baseSeed + 29, -8, 8),
    rise: mapHashToRange(baseSeed + 43, 60, 86),
    durationMs: mapHashToRange(baseSeed + 61, 2700, 3200),
    scale: mapHashToRange(baseSeed + 79, 0.94, 1.04),
    tilt: mapHashToRange(baseSeed + 97, -4, 4),
  };
}

function ReactionBubble({
  reaction,
  anchored,
}: {
  reaction: VisibleReaction;
  anchored: boolean;
}) {
  return (
    <div
      className={`absolute ${
        anchored ? "bottom-0 left-1/2" : "bottom-0 right-0"
      }`}
    >
      <div
        className={`reaction-pill ${anchored ? "-translate-x-1/2" : ""}`}
        style={{
          ["--reaction-drift" as string]: `${reaction.meta.drift}px`,
          ["--reaction-sway" as string]: `${reaction.meta.sway}px`,
          ["--reaction-rise" as string]: `${reaction.meta.rise}px`,
          ["--reaction-duration" as string]: `${reaction.meta.durationMs}ms`,
          ["--reaction-scale" as string]: `${reaction.meta.scale}`,
          ["--reaction-tilt" as string]: `${reaction.meta.tilt}deg`,
        }}
      >
        <div className="rounded-full border border-white/15 bg-white/90 px-3 py-1 text-center text-[#24145b] shadow-sm backdrop-blur-sm">
        {!anchored && (
          <p className="mb-0.5 max-w-[132px] truncate font-condensed text-[9px] uppercase tracking-[0.24em] text-[#6a5d9d]">
            {reaction.playerName}
          </p>
        )}
        <p
          className={`font-body ${
            reaction.isEmoji ? "text-2xl leading-none" : "text-sm font-semibold"
          }`}
        >
          {reaction.text}
        </p>
        </div>
      </div>
    </div>
  );
}

export function ReactionProvider({
  roomId,
  children,
}: {
  roomId: Id<"rooms">;
  children: ReactNode;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [anchorCounts, setAnchorCounts] = useState<Record<string, number>>({});

  const messages = useQuery(api.chat.getRecentMessages, { roomId });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const registerAnchor = useCallback((playerId: string) => {
    setAnchorCounts((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] ?? 0) + 1,
    }));
  }, []);

  const unregisterAnchor = useCallback((playerId: string) => {
    setAnchorCounts((prev) => {
      const nextCount = (prev[playerId] ?? 0) - 1;
      if (nextCount <= 0) {
        const next = { ...prev };
        delete next[playerId];
        return next;
      }

      return {
        ...prev,
        [playerId]: nextCount,
      };
    });
  }, []);

  const visibleReactions = useMemo(() => {
    if (!messages) {
      return [];
    }

    return [...messages]
      .sort((left, right) => left.sentAt - right.sentAt)
      .filter((message) => now - message.sentAt < REACTION_LIFETIME_MS)
      .map((message) => ({ ...message, meta: createReactionMeta(message) }));
  }, [messages, now]);

  const reactionsByPlayer = useMemo(() => {
    const grouped = new Map<string, VisibleReaction[]>();

    for (const reaction of visibleReactions) {
      const playerKey = String(reaction.playerId);
      const current = grouped.get(playerKey) ?? [];
      current.push(reaction);
      grouped.set(playerKey, current);
    }

    return grouped;
  }, [visibleReactions]);

  const fallbackReactions = useMemo(
    () =>
      visibleReactions.filter(
        (reaction) => !anchorCounts[String(reaction.playerId)]
      ),
    [anchorCounts, visibleReactions]
  );

  const contextValue = useMemo<ReactionContextValue>(
    () => ({
      fallbackReactions,
      getReactionsForPlayer: (playerId: string) =>
        reactionsByPlayer.get(playerId) ?? [],
      registerAnchor,
      unregisterAnchor,
    }),
    [fallbackReactions, reactionsByPlayer, registerAnchor, unregisterAnchor]
  );

  return (
    <ReactionContext.Provider value={contextValue}>
      {children}
      {fallbackReactions.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[44] flex justify-center px-4 sm:justify-end sm:px-6">
          <div className="relative h-0 w-full max-w-[280px]">
            {fallbackReactions.slice(-6).map((reaction) => (
              <ReactionBubble
                key={reaction._id}
                reaction={reaction}
                anchored={false}
              />
            ))}
          </div>
        </div>
      )}
    </ReactionContext.Provider>
  );
}

export function useReactionAnchors() {
  const context = useContext(ReactionContext);

  if (!context) {
    throw new Error("useReactionAnchors must be used within ReactionProvider.");
  }

  return context;
}

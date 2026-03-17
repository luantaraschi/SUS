"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useReactionAnchors } from "./ReactionProvider";

export function ReactionAnchor({
  playerId,
  className = "",
  children,
}: {
  playerId: string;
  className?: string;
  children: ReactNode;
}) {
  const { getReactionsForPlayer, registerAnchor, unregisterAnchor } =
    useReactionAnchors();

  useEffect(() => {
    registerAnchor(playerId);
    return () => unregisterAnchor(playerId);
  }, [playerId, registerAnchor, unregisterAnchor]);

  const reactions = getReactionsForPlayer(playerId);

  return (
    <div className={`relative ${className}`}>
      {children}
      {reactions.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full z-30 h-0">
          {reactions.map((reaction) => (
            <div
              key={reaction._id}
              className="absolute bottom-0 left-1/2"
            >
              <div
                className="reaction-pill -translate-x-1/2"
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
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import PlayerAvatar from "./PlayerAvatar";

interface IdentityBarProps {
  name: string;
  avatarSeed?: string;
  imageUrl?: string | null;
  statusLabel: string;
  detailLabel: string;
}

export default function IdentityBar({
  name,
  avatarSeed,
  imageUrl,
  statusLabel,
  detailLabel,
}: IdentityBarProps) {
  return (
    <div className="fixed bottom-16 left-1/2 z-30 w-[min(92vw,560px)] -translate-x-1/2 rounded-full border border-white/15 bg-black/30 px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-md sm:bottom-20">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          name={name}
          avatarSeed={avatarSeed}
          imageUrl={imageUrl}
          size="sm"
          hideName
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base text-white sm:text-lg">{name}</p>
          <p className="truncate font-condensed text-[11px] uppercase tracking-[0.24em] text-white/65 sm:text-xs">
            {detailLabel}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/80">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

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
    <div className="relative z-20 mt-3 w-[min(92vw,520px)] self-center rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] px-3 py-2 shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          name={name}
          avatarSeed={avatarSeed}
          imageUrl={imageUrl}
          size="sm"
          hideName
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base text-[var(--panel-text)] sm:text-lg">{name}</p>
          <p className="truncate font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--panel-soft-text)] sm:text-xs">
            {detailLabel}
          </p>
        </div>
        <span className="rounded-full border border-[var(--control-border)] bg-[var(--control-surface-muted)] px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--control-text)]">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

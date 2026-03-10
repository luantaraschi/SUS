"use client";

import { Icon } from "@iconify/react";
import BotIcon from "./BotIcon";

type PlayerStatus = "online" | "ready" | "waiting" | "disconnected";

interface PlayerAvatarProps {
  name: string;
  emoji?: string;
  avatarSeed?: string;
  isHost?: boolean;
  isBot?: boolean;
  status?: PlayerStatus;
  canRemove?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  hideName?: boolean;
}

const STATUS_INDICATOR: Record<PlayerStatus, { color: string; label: string }> = {
  online: { color: "bg-game-safe", label: "" },
  ready: { color: "bg-game-safe", label: "Pronto" },
  waiting: { color: "bg-game-warning", label: "Aguardando" },
  disconnected: { color: "bg-surface-primary/40", label: "Offline" },
};

const BG_COLORS = [
  "b6e3f4", "c0aede", "d1d4f9",
  "ffd5dc", "ffdfbf", "c7f2a4",
  "f9c6d0", "b5ead7", "ffeaa7",
];

function getBgColor(seed: string): string {
  const index =
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    BG_COLORS.length;
  return BG_COLORS[index];
}

export function getAvatarUrl(seed: string, size: number): string {
  const bg = getBgColor(seed);
  return (
    `https://api.dicebear.com/9.x/adventurer/svg` +
    `?seed=${encodeURIComponent(seed)}` +
    `&backgroundColor=${bg}` +
    `&radius=50` +
    `&size=${size}` +
    `&v=${encodeURIComponent(seed.slice(0, 4))}`
  );
}

const SIZE_MAP = {
  sm: { container: "h-12 w-12", img: 48, crown: "text-sm" },
  md: { container: "h-16 w-16", img: 64, crown: "text-base" },
  lg: { container: "h-20 w-20", img: 80, crown: "text-lg" },
  xl: { container: "h-32 w-32", img: 128, crown: "text-2xl" },
  "2xl": { container: "h-40 w-40 sm:h-48 sm:w-48", img: 192, crown: "text-4xl sm:text-5xl" },
};

export default function PlayerAvatar({
  name,
  emoji,
  avatarSeed,
  isHost = false,
  isBot = false,
  status = "online",
  canRemove = false,
  onRemove,
  className = "",
  size = "md",
  hideName = false,
}: PlayerAvatarProps) {
  const statusInfo = STATUS_INDICATOR[status];
  const isDimmed = !isBot && (status === "disconnected" || status === "waiting");
  const showStatusIndicator = !isBot && Boolean(statusInfo.color);
  const showStatusLabel = !isBot && Boolean(statusInfo.label);
  const { container, img, crown } = SIZE_MAP[size];

  const seed = avatarSeed ?? emoji ?? name;
  const avatarUrl = getAvatarUrl(seed, img);

  return (
    <div className={`flex flex-col items-center gap-1 ${isDimmed ? "opacity-60" : ""} ${className}`}>
      {isHost && (
        <span className={`${crown} leading-none drop-shadow-md -mb-1 z-10`} aria-label="Host">
          {"\u{1F451}"}
        </span>
      )}

      <div className={`relative ${container}`}>
        {isBot && (
          <span className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#1e1b6e] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <BotIcon className="h-3.5 w-3.5" />
          </span>
        )}

        {canRemove && onRemove && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            className="absolute right-0 top-0 z-20 flex h-7 w-7 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95"
            aria-label={`Remover ${name}`}
          >
            <Icon icon="solar:close-circle-bold" width={28} height={28} />
          </button>
        )}

        <div
          className={`relative h-full w-full overflow-hidden rounded-full ${
            isHost ? "border-[3px] border-yellow-400" : "border-[3px] border-white"
          }`}
        >
          {/* DiceBear returns dynamic remote SVGs; plain img keeps this dependency simple. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={name}
            width={img}
            height={img}
            className="h-full w-full object-cover"
            onError={(event) => {
              const target = event.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent && !parent.querySelector(".avatar-fallback")) {
                const fallback = document.createElement("div");
                fallback.className =
                  "avatar-fallback flex h-full w-full items-center justify-center bg-surface-primary text-white font-bold text-xl";
                fallback.textContent = name.charAt(0).toUpperCase();
                parent.appendChild(fallback);
              }
            }}
          />

          {showStatusIndicator && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${statusInfo.color}`}
            />
          )}
        </div>
      </div>

      {!hideName && (
        <span className="font-hand text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          [{name}]
        </span>
      )}

      {showStatusLabel && (
        <span className="font-condensed text-[10px] uppercase tracking-wider text-white/70">
          {statusInfo.label}
        </span>
      )}
    </div>
  );
}

"use client";

import BotIcon from "../BotIcon";

interface AvatarBadgesProps {
  name: string;
  isHost: boolean;
  isBot: boolean;
  canRemove: boolean;
  onRemove?: () => void;
  /** Crown font-size class from SIZE_MAP (e.g. "text-lg"). */
  crownClass: string;
  /** Bot badge position + size classes from SIZE_MAP. */
  botBadgeClass: string;
  /** Bot icon size classes from SIZE_MAP. */
  botIconClass: string;
}

/**
 * Renders the overlay badges on a player avatar:
 *   - host crown (above the circle, rendered by the parent)
 *   - bot badge (top-left of the circle)
 *   - remove button (top-right of the circle)
 *
 * The host crown is rendered here as a standalone export so PlayerAvatar can
 * place it outside the relative container (above the circle).
 */
export function HostCrown({ crownClass }: { crownClass: string }) {
  return (
    <span
      className={`${crownClass} relative z-10 -mb-3 -translate-y-1 leading-none drop-shadow-md sm:-mb-4`}
      aria-label="Host"
    >
      {"\u{1F451}"}
    </span>
  );
}

/**
 * Renders bot badge and remove button — both are absolutely-positioned overlays
 * inside the relative avatar container.
 */
export default function AvatarBadges({
  name,
  isBot,
  canRemove,
  onRemove,
  botBadgeClass,
  botIconClass,
}: AvatarBadgesProps) {
  return (
    <>
      {isBot && (
        <span
          className={`absolute z-10 flex items-center justify-center rounded-full border-white bg-[#1e1b6e] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${botBadgeClass}`}
        >
          <BotIcon className={botIconClass} />
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
          className="absolute -top-1 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white text-[10px] hover:bg-game-impostor transition-colors"
          aria-label={`Remover ${name}`}
        >
          &times;
        </button>
      )}
    </>
  );
}

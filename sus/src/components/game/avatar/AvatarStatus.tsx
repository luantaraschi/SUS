"use client";

interface AvatarStatusProps {
  /** Tailwind bg colour class for the status dot (e.g. "bg-game-safe"). */
  colorClass: string;
  /** Position + size classes from SIZE_MAP (e.g. "-bottom-0.5 -right-0.5 h-3 w-3 border-2"). */
  indicatorClass: string;
}

/**
 * Renders the small status dot positioned inside the avatar circle.
 * Absolutely positioned — must live inside a `relative` container.
 */
export default function AvatarStatus({ colorClass, indicatorClass }: AvatarStatusProps) {
  return (
    <span
      className={`absolute rounded-full border-white ${indicatorClass} ${colorClass}`}
    />
  );
}

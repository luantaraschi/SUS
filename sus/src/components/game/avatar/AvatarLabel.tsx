"use client";

interface AvatarLabelProps {
  name: string;
  /** Tailwind text-size class from SIZE_MAP (e.g. "text-sm"). */
  nameClass: string;
  /** Whether to show the status label text (e.g. "Pronto", "Aguardando"). */
  showStatusLabel: boolean;
  statusLabel: string;
}

/**
 * Renders the player name (bracketed, handwritten font) and optional status
 * label text (e.g. "Pronto", "Aguardando") below the avatar circle.
 */
export default function AvatarLabel({
  name,
  nameClass,
  showStatusLabel,
  statusLabel,
}: AvatarLabelProps) {
  return (
    <>
      <span
        className={`font-hand text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${nameClass}`}
      >
        [{name}]
      </span>

      {showStatusLabel && (
        <span className="font-condensed text-[10px] uppercase tracking-wider text-white/70">
          {statusLabel}
        </span>
      )}
    </>
  );
}

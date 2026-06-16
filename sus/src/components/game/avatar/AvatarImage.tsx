"use client";

import { useState } from "react";

/**
 * Dicebear background colours passed as URL query params (backgroundColor=<hex>).
 * These are NOT CSS design tokens — they go directly into the dicebear service URL
 * and must remain as plain hex strings without a leading `#`.
 */
export const AVATAR_BG_PALETTE = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
  "c7f2a4",
  "f9c6d0",
  "b5ead7",
  "ffeaa7",
];

function getBgColor(seed: string): string {
  const index =
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    AVATAR_BG_PALETTE.length;
  return AVATAR_BG_PALETTE[index];
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

interface AvatarImageProps {
  name: string;
  /** Pixel size passed to the dicebear URL and as img width/height. */
  size: number;
  seed: string;
  imageUrl?: string | null;
}

/**
 * Renders the avatar image with a three-stage fallback:
 *   upload → dicebear generated → initial letter.
 */
export default function AvatarImage({ name, size, seed, imageUrl }: AvatarImageProps) {
  const generatedAvatarUrl = getAvatarUrl(seed, size);
  const [displayMode, setDisplayMode] = useState<"upload" | "generated" | "fallback">(
    imageUrl ? "upload" : "generated"
  );

  const src =
    displayMode === "upload"
      ? (imageUrl ?? generatedAvatarUrl)
      : displayMode === "generated"
        ? generatedAvatarUrl
        : null;

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-primary text-xl font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="h-full w-full object-cover"
      onError={() => {
        if (displayMode === "upload") {
          setDisplayMode("generated");
          return;
        }
        setDisplayMode("fallback");
      }}
    />
  );
}

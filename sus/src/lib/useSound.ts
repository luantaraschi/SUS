"use client";

/**
 * useSound — thin React hook over the sound/index.ts store.
 *
 * Preserves the original API surface (play, muted, toggleMute) so existing
 * call sites need only update their SoundEvent string names, not the hook
 * usage pattern.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  playSound as _playSound,
  getMuted,
  getMutedServer,
  toggleMuted,
  subscribe,
  type SoundEvent,
} from "./sound/index";

export type { SoundEvent };

export function useSound() {
  const muted = useSyncExternalStore(subscribe, getMuted, getMutedServer);

  const play = useCallback((event: SoundEvent) => {
    _playSound(event);
  }, []);

  const toggleMute = useCallback(() => {
    toggleMuted();
  }, []);

  return { play, muted, toggleMute };
}

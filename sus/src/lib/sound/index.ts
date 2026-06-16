/**
 * sound/index.ts — Public API for the SUS sound system.
 *
 * Exports:
 *  - playSound(event)            — guarded against mute + SSR
 *  - getMuted() / setMuted(b) / toggleMuted()  — persisted to localStorage
 *  - getVolume() / setVolume(0..1)             — persisted to localStorage,
 *                                                applied to engine master gain
 *  - getMutedServer()            — stable server-side snapshot (always false)
 *  - subscribe(cb)               — useSyncExternalStore-compatible
 */

import type { SoundEvent } from "./sounds";
import { SOUND_MAP } from "./sounds";
import { setMasterVolume } from "./engine";

export type { SoundEvent };

// ---------------------------------------------------------------------------
// Persistence keys
// ---------------------------------------------------------------------------

const MUTE_KEY = "sus.sound.muted";
const VOLUME_KEY = "sus.sound.volume";
const DEFAULT_VOLUME = 0.75;

// ---------------------------------------------------------------------------
// In-memory state (module singletons — client-only module)
// ---------------------------------------------------------------------------

let _muted = false;
let _volume = DEFAULT_VOLUME;
let _hydrated = false;

/** Lazily hydrate state from localStorage on first client-side access. */
function hydrate(): void {
  if (_hydrated || typeof window === "undefined") return;
  _hydrated = true;

  try {
    const storedMute = window.localStorage.getItem(MUTE_KEY);
    if (storedMute !== null) _muted = storedMute === "true";

    const storedVol = window.localStorage.getItem(VOLUME_KEY);
    if (storedVol !== null) {
      const v = parseFloat(storedVol);
      if (!isNaN(v)) _volume = Math.min(Math.max(v, 0), 1);
    }
  } catch {
    // localStorage unavailable — keep defaults
  }
}

// ---------------------------------------------------------------------------
// External store — useSyncExternalStore-compatible
// ---------------------------------------------------------------------------

type Listener = () => void;
let _listeners: Listener[] = [];

function emitChange(): void {
  for (const cb of _listeners) cb();
}

/** Subscribe to mute/volume state changes. Returns an unsubscribe function. */
export function subscribe(cb: Listener): () => void {
  _listeners = [..._listeners, cb];
  return () => {
    _listeners = _listeners.filter((l) => l !== cb);
  };
}

// ---------------------------------------------------------------------------
// Mute API
// ---------------------------------------------------------------------------

/** Returns current muted state. Safe to call server-side (returns false). */
export function getMuted(): boolean {
  hydrate();
  return _muted;
}

/** Stable server-side snapshot — always returns false. */
export function getMutedServer(): boolean {
  return false;
}

export function setMuted(value: boolean): void {
  hydrate();
  _muted = value;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_KEY, value ? "true" : "false");
    }
  } catch {
    // ignore
  }
  emitChange();
}

export function toggleMuted(): void {
  setMuted(!getMuted());
}

// ---------------------------------------------------------------------------
// Volume API
// ---------------------------------------------------------------------------

/** Returns current volume (0–1). Safe to call server-side (returns default). */
export function getVolume(): number {
  hydrate();
  return _volume;
}

export function setVolume(value: number): void {
  hydrate();
  _volume = Math.min(Math.max(value, 0), 1);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOLUME_KEY, String(_volume));
    }
  } catch {
    // ignore
  }
  // Apply immediately to the engine's master GainNode
  setMasterVolume(_volume);
  emitChange();
}

// ---------------------------------------------------------------------------
// playSound — the main public entry point
// ---------------------------------------------------------------------------

/**
 * Play a sound event. No-ops when:
 *  - running on the server (SSR)
 *  - sound is muted
 *  - the event key is absent from SOUND_MAP (defensive)
 */
export function playSound(event: SoundEvent): void {
  if (typeof window === "undefined") return;
  hydrate();
  if (_muted) return;

  try {
    const fn = SOUND_MAP[event];
    if (fn) fn();
  } catch {
    // Silently swallow — audio failure must never break game logic
  }
}

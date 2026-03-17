"use client";

import { useCallback, useSyncExternalStore } from "react";
import { playSynth } from "./synthSounds";

export type SoundName =
  | "click"
  | "vote"
  | "reveal"
  | "win"
  | "lose"
  | "tick"
  | "message"
  | "next-round"
  | "join"
  | "kick";

const MUTE_KEY = "sus.sound.muted";
const audioCache = new Map<string, HTMLAudioElement>();

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "true";
}

function getSnapshot(): boolean {
  return getMuted();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSound() {
  const muted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const play = useCallback((name: SoundName) => {
    if (getMuted()) return;
    const path = `/sounds/${name}.mp3`;
    let audio = audioCache.get(path);
    if (!audio) {
      audio = new Audio(path);
      audio.volume = 0.5;
      audioCache.set(path, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      playSynth(name);
    });
  }, []);

  const toggleMute = useCallback(() => {
    const next = !getMuted();
    window.localStorage.setItem(MUTE_KEY, next ? "true" : "false");
    emitChange();
  }, []);

  return { play, muted, toggleMute };
}

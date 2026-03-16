"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "sus-session-id";

function subscribe() {
  return () => undefined;
}

function getClientSnapshot() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getServerSnapshot() {
  return null;
}

export function useSessionId(): string | null {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

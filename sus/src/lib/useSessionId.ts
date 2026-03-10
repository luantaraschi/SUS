"use client";

import { useState, useEffect } from "react";

const SESSION_KEY = "sus-session-id";

/**
 * Generates a persistent sessionId (UUID v4) stored in localStorage.
 * Used to identify the player across mutations/queries without auth.
 */
export function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}

"use client";

import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 10;
export const MAX_IMPOSTORS = 3;

type Mode = "word" | "question";
type QuestionMode = "system" | "master";

type SettingsPatch = {
  maxPlayers?: number;
  rounds?: number;
  numImpostors?: number;
  customMasterId?: string;
  defaultPackKey?: string;
  customPackId?: Id<"customPacks">;
  impostorHint?: boolean;
};

type RoomLike = {
  _id: Id<"rooms">;
  mode: Mode;
  questionMode?: QuestionMode;
  settings: {
    maxPlayers: number;
    rounds: number;
    impostorHint: boolean;
    numImpostors?: number;
  };
};

type UseRoomSettingsArgs = {
  room: RoomLike | null | undefined;
  sessionId: string | null | undefined;
  isHost: boolean;
  /** Active (non-disconnected) player count — caps the lower bound for maxPlayers / impostors. */
  playerCount: number;
};

/**
 * Wraps the `updateSettings` Convex mutation plus the delta / toggle logic for
 * every lobby control. All handlers are host-gated and clamp to the shared
 * bounds, so the panel can call them directly with raw +/- deltas.
 */
export function useRoomSettings({ room, sessionId, isHost, playerCount }: UseRoomSettingsArgs) {
  const updateSettings = useMutation(api.rooms.updateSettings);

  const numImpostors = room?.settings.numImpostors || 1;
  const maxImpostors = room ? Math.min(MAX_IMPOSTORS, Math.max(1, room.settings.maxPlayers - 2)) : MAX_IMPOSTORS;

  const patchSettings = useCallback(
    (settings: SettingsPatch) => {
      if (!room || !sessionId || !isHost) return;
      void updateSettings({ roomId: room._id, sessionId, settings });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const changeMaxPlayers = useCallback(
    (delta: number) => {
      if (!room) return;
      const floor = Math.max(MIN_PLAYERS, playerCount);
      patchSettings({
        maxPlayers: Math.max(floor, Math.min(MAX_PLAYERS, room.settings.maxPlayers + delta)),
      });
    },
    [patchSettings, playerCount, room]
  );

  const changeRounds = useCallback(
    (delta: number) => {
      if (!room) return;
      patchSettings({ rounds: Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, room.settings.rounds + delta)) });
    },
    [patchSettings, room]
  );

  const changeImpostors = useCallback(
    (delta: number) => {
      if (!room) return;
      patchSettings({ numImpostors: Math.max(1, Math.min(maxImpostors, numImpostors + delta)) });
    },
    [maxImpostors, numImpostors, patchSettings, room]
  );

  const changeMode = useCallback(
    (mode: Mode) => {
      if (!room || !sessionId || !isHost || room.mode === mode) return;
      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: {},
        mode,
        ...(mode === "question" ? { questionMode: "system" as const } : {}),
      });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const changeQuestionMode = useCallback(
    (questionMode: QuestionMode) => {
      if (!room || !sessionId || !isHost || room.questionMode === questionMode) return;
      void updateSettings({ roomId: room._id, sessionId, settings: {}, questionMode });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const changeMaster = useCallback(
    (playerId: string) => patchSettings({ customMasterId: playerId }),
    [patchSettings]
  );

  const changePack = useCallback(
    (value: string) => {
      if (!value) {
        patchSettings({ defaultPackKey: "classico", customPackId: undefined });
        return;
      }
      if (value.startsWith("default:")) {
        patchSettings({ defaultPackKey: value.replace("default:", ""), customPackId: undefined });
        return;
      }
      patchSettings({
        customPackId: value.replace("custom:", "") as Id<"customPacks">,
        defaultPackKey: undefined,
      });
    },
    [patchSettings]
  );

  const toggleHint = useCallback(() => {
    if (!room) return;
    patchSettings({ impostorHint: !room.settings.impostorHint });
  }, [patchSettings, room]);

  return useMemo(
    () => ({
      numImpostors,
      maxImpostors,
      changeMaxPlayers,
      changeRounds,
      changeImpostors,
      changeMode,
      changeQuestionMode,
      changeMaster,
      changePack,
      toggleHint,
    }),
    [
      changeImpostors,
      changeMaster,
      changeMaxPlayers,
      changeMode,
      changePack,
      changeQuestionMode,
      changeRounds,
      maxImpostors,
      numImpostors,
      toggleHint,
    ]
  );
}

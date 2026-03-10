export const ROOM_CODE_LENGTH = 4;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const DEFAULT_DISCUSSION_TIME = 120; // seconds
export const DEFAULT_VOTING_TIME = 60;
export const DEFAULT_ROUNDS = 3;
export const PHASES = [
  "secret",
  "answer",
  "reveal",
  "discussion",
  "voting",
  "result",
] as const;

import { PHASES } from "./constants";

export type Phase = (typeof PHASES)[number];

export type GameMode = "word" | "question" | "location";

export type PlayerStatus = "online" | "ready" | "waiting" | "disconnected";

export interface Player {
  id: string;
  name: string;
  emoji: string;
  isHost: boolean;
  isBot: boolean;
  status: PlayerStatus;
  isImpostor: boolean;
  score: number;
}

export interface Room {
  code: string;
  hostId: string;
  mode: GameMode;
  maxPlayers: number;
  rounds: number;
  discussionTime: number;
  votingTime: number;
  currentRound: number;
  currentPhase: Phase;
  players: Player[];
  createdAt: number;
}

export interface Vote {
  voterId: string;
  targetId: string;
  roundNumber: number;
}

export type BackgroundVariant = "default" | "valid" | "invalid";

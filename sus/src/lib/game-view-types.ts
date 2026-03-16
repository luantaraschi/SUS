import type { Doc, Id } from "../../convex/_generated/dataModel";

export type PublicPlayer = {
  _id: Id<"players">;
  _creationTime: number;
  roomId: Id<"rooms">;
  sessionId: string;
  name: string;
  emoji: string;
  avatarImageUrl: string | null;
  isHost: boolean;
  isBot?: boolean;
  status: "connected" | "ready" | "disconnected";
  score: number;
  joinedAt: number;
};

export type RoleView = {
  role: "master" | "impostor" | "player";
  secretContent: string | null;
  isImpostor: boolean;
  masterImpostorIds?: string[];
} | null;

export type SafeRound = Omit<Doc<"rounds">, "impostorId" | "impostorIds">;

import { describe, expect, it } from "vitest";
import { getActivePlayers, getConnectedPlayers } from "../players";
import type { PublicPlayer } from "../game-view-types";

// Minimal factory — only the fields the helpers inspect
function makePlayer(overrides: Partial<PublicPlayer> = {}): PublicPlayer {
  return {
    _id: "p1" as PublicPlayer["_id"],
    _creationTime: 0,
    roomId: "r1" as PublicPlayer["roomId"],
    sessionId: "s1",
    name: "Player",
    emoji: "😀",
    avatarImageUrl: null,
    isHost: false,
    isBot: false,
    isSpectator: false,
    status: "connected",
    score: 0,
    joinedAt: 0,
    ...overrides,
  };
}

// ── getConnectedPlayers ────────────────────────────────────────────────────────

describe("getConnectedPlayers", () => {
  it("includes a normally connected player", () => {
    const p = makePlayer({ status: "connected" });
    expect(getConnectedPlayers([p])).toEqual([p]);
  });

  it("includes a 'ready' player (non-disconnected status)", () => {
    const p = makePlayer({ status: "ready" });
    expect(getConnectedPlayers([p])).toEqual([p]);
  });

  it("excludes a disconnected player", () => {
    const p = makePlayer({ status: "disconnected" });
    expect(getConnectedPlayers([p])).toEqual([]);
  });

  it("includes spectators (spectators are still connected players)", () => {
    const p = makePlayer({ isSpectator: true, status: "connected" });
    expect(getConnectedPlayers([p])).toEqual([p]);
  });

  it("includes bots (bots appear in the lobby list)", () => {
    const p = makePlayer({ isBot: true, status: "connected" });
    expect(getConnectedPlayers([p])).toEqual([p]);
  });

  it("excludes only the disconnected ones in a mixed list", () => {
    const connected = makePlayer({ _id: "p1" as PublicPlayer["_id"], status: "connected" });
    const ready = makePlayer({ _id: "p2" as PublicPlayer["_id"], status: "ready" });
    const disconnected = makePlayer({ _id: "p3" as PublicPlayer["_id"], status: "disconnected" });
    expect(getConnectedPlayers([connected, ready, disconnected])).toEqual([connected, ready]);
  });

  it("returns empty array for empty input", () => {
    expect(getConnectedPlayers([])).toEqual([]);
  });
});

// ── getActivePlayers ───────────────────────────────────────────────────────────

describe("getActivePlayers", () => {
  it("includes a normal connected human player", () => {
    const p = makePlayer({ status: "connected" });
    expect(getActivePlayers([p])).toEqual([p]);
  });

  it("includes a 'ready' non-bot non-spectator player", () => {
    const p = makePlayer({ status: "ready" });
    expect(getActivePlayers([p])).toEqual([p]);
  });

  it("excludes a disconnected player", () => {
    const p = makePlayer({ status: "disconnected" });
    expect(getActivePlayers([p])).toEqual([]);
  });

  it("excludes a spectator (even if connected)", () => {
    const p = makePlayer({ isSpectator: true, status: "connected" });
    expect(getActivePlayers([p])).toEqual([]);
  });

  it("excludes a bot", () => {
    const p = makePlayer({ isBot: true, status: "connected" });
    expect(getActivePlayers([p])).toEqual([]);
  });

  it("excludes a disconnected spectator bot (all three flags)", () => {
    const p = makePlayer({ isBot: true, isSpectator: true, status: "disconnected" });
    expect(getActivePlayers([p])).toEqual([]);
  });

  it("filters correctly in a mixed list", () => {
    const normal = makePlayer({ _id: "p1" as PublicPlayer["_id"], status: "connected" });
    const spectator = makePlayer({ _id: "p2" as PublicPlayer["_id"], isSpectator: true });
    const bot = makePlayer({ _id: "p3" as PublicPlayer["_id"], isBot: true });
    const disconnected = makePlayer({ _id: "p4" as PublicPlayer["_id"], status: "disconnected" });
    expect(getActivePlayers([normal, spectator, bot, disconnected])).toEqual([normal]);
  });

  it("returns empty array for empty input", () => {
    expect(getActivePlayers([])).toEqual([]);
  });
});

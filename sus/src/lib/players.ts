import type { PublicPlayer } from "./game-view-types";

/**
 * Returns players that are not disconnected.
 *
 * Used wherever the UI shows a list of players in the lobby or for
 * master-picker dropdowns — spectators and bots are intentionally included
 * because they can still appear in those lists.
 */
export function getConnectedPlayers(players: PublicPlayer[]): PublicPlayer[] {
  return players.filter((p) => p.status !== "disconnected");
}

/**
 * Returns human players who are actively participating in the current round:
 * connected (not disconnected), not a spectator, and not a bot.
 *
 * Note: this does NOT exclude the master — callers that need to exclude the
 * master must apply an additional filter themselves, because masterId is a
 * round-level concern, not a player-level one.
 */
export function getActivePlayers(players: PublicPlayer[]): PublicPlayer[] {
  return players.filter(
    (p) => p.status !== "disconnected" && !p.isSpectator && !p.isBot
  );
}

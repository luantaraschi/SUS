import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.js";
import { query, type MutationCtx } from "./_generated/server.js";

export async function attemptSaveHistory(
  ctx: MutationCtx,
  args: { roomId: Id<"rooms"> }
) {
  const room = await ctx.db.get(args.roomId);
  if (!room) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
    .collect();

  const rounds = await ctx.db
    .query("rounds")
    .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
    .collect();

  const completedRounds = rounds.filter((round) => round.status === "results");
  if (completedRounds.length === 0) return;

  const playedAt = Date.now();

  for (const player of players) {
    if (player.isBot) continue;

    let wasImpostor = 0;
    let timesDetected = 0;
    let timesSurvived = 0;
    let correctVotes = 0;

    for (const round of completedRounds) {
      const impostorIds = round.impostorIds ?? (round.impostorId ? [round.impostorId] : []);
      if (impostorIds.includes(player._id)) {
        wasImpostor += 1;
        if (round.votedOutId === player._id) {
          timesDetected += 1;
        } else {
          timesSurvived += 1;
        }
        continue;
      }

      const myVote = await ctx.db
        .query("votes")
        .withIndex("by_round_voter", (q) => q.eq("roundId", round._id).eq("voterId", player._id))
        .first();

      if (myVote && impostorIds.includes(myVote.targetId)) {
        correctVotes += 1;
      }
    }

    await ctx.db.insert("gameHistory", {
      userId: undefined,
      sessionId: player.sessionId,
      roomCode: room.code,
      mode: room.mode,
      totalRounds: completedRounds.length,
      wasImpostor,
      timesDetected,
      timesSurvived,
      correctVotes,
      finalScore: player.score,
      finalRank: 0,
      totalPlayers: players.length,
      playedAt,
    });
  }

  const recentHistories = await ctx.db
    .query("gameHistory")
    .withIndex("by_session")
    .collect();

  const currentMatchHistories = recentHistories
    .filter((history) => history.roomCode === room.code && history.playedAt === playedAt)
    .sort((left, right) => right.finalScore - left.finalScore);

  for (const [index, history] of currentMatchHistories.entries()) {
    await ctx.db.patch(history._id, {
      finalRank: index + 1,
    });
  }
}

export const getPlayerHistory = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameHistory")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(20);
  },
});

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.js";
import { query } from "./_generated/server.js";

// Called internally when the last round ends
export async function attemptSaveHistory(ctx: any, args: { roomId: Id<"rooms"> }) {
  const room = await ctx.db.get(args.roomId);
  if (!room) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
    .collect();

  const rounds = await ctx.db
    .query("rounds")
    .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
    .collect();

  if (rounds.length === 0) return;

  const completedRounds = rounds.filter((r: any) => r.status === "results");
  
  // Check if history already exists for this room to avoid duplicates
  // Using a simple check: if any player has a history record for this roomCode and playedAt recently
  // We can just rely on the fact this is called exactly once per game.

  for (const player of players) {
    if (player.isBot) continue;

    let wasImpostor = 0;
    let timesDetected = 0;
    let timesSurvived = 0;
    let correctVotes = 0;

    for (const round of completedRounds) {
      const impostorIds = round.impostorIds || (round.impostorId ? [round.impostorId] : []);
      if (impostorIds.includes(player._id)) {
        wasImpostor++;
        if (round.votedOutId === player._id) {
          timesDetected++;
        } else {
          timesSurvived++;
        }
      } else {
        // Check if they voted correctly
        const myVote = await ctx.db
          .query("votes")
          .withIndex("by_round_voter", (q: any) =>
            q.eq("roundId", round._id).eq("voterId", player._id)
          )
            .first();

          if (myVote && impostorIds.includes(myVote.targetId)) {
            correctVotes++;
          }
        }
      }

      // Try to find if player has a userId (from a user account)
      let userId: Id<"users"> | undefined = undefined;
      // We don't have a direct userId on player. We should fetch from users by sessionId maybe?
      // Or we can just leave it undefined and rely on sessionId, since later when user logs in, we might link it.
      // But wait! Convex Auth creates `users` table. Does it have `sessionId`? No.
      // We created `linkSession` to link `sessionId` to `userId`. We can just store `sessionId`.

      await ctx.db.insert("gameHistory", {
        userId,
        sessionId: player.sessionId,
        roomCode: room.code,
        mode: room.mode,
        totalRounds: completedRounds.length,
        wasImpostor,
        timesDetected,
        timesSurvived,
        correctVotes,
        finalScore: player.score,
        finalRank: 0, // We'll compute rank below
        totalPlayers: players.length,
        playedAt: Date.now(),
      });
    }

  // Now compute ranks for the newly inserted records
  const recentHistories = await ctx.db
    .query("gameHistory")
    .withIndex("by_session") // This isn't perfect for filtering by room, but we can just filter in memory
    .collect();

  const currentMatchHistories = recentHistories.filter(
    (h: any) => h.roomCode === room.code && Date.now() - h.playedAt < 10000
  );

  // Sort by finalScore descending
  currentMatchHistories.sort((a: any, b: any) => b.finalScore - a.finalScore);

  for (let i = 0; i < currentMatchHistories.length; i++) {
      await ctx.db.patch(currentMatchHistories[i]._id, {
          finalRank: i + 1,
      });
  }
}

export const getPlayerHistory = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // If the user is logged in, we might want to get history by userId.
    // Let's just return by sessionId for now.
    const histories = await ctx.db
      .query("gameHistory")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .order("desc") // newest first
      .take(20);

    return histories;
  },
});


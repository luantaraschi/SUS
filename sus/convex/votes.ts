import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.js";
import { mutation, query } from "./_generated/server.js";

export const submitVote = mutation({
  args: {
    roundId: v.id("rounds"),
    voterId: v.id("players"),
    sessionId: v.string(),
    suspectId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada não encontrada");
    if (round.status !== "voting") throw new Error("Não é hora de votar");

    const voter = await ctx.db.get(args.voterId);
    if (!voter || voter.roomId !== round.roomId) {
      throw new Error("Jogador invalido");
    }
    if (!voter.isBot && voter.sessionId !== args.sessionId) {
      throw new Error("Sessao invalida");
    }

    // Check if already voted
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_round_voter", (q) =>
        q.eq("roundId", args.roundId).eq("voterId", args.voterId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { targetId: args.suspectId });
    } else {
      await ctx.db.insert("votes", {
        roundId: args.roundId,
        voterId: args.voterId,
        targetId: args.suspectId,
      });
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) return;

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = players.filter((p) => p.status !== "disconnected" && p._id !== round.masterId);
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (votes.length >= activePlayers.length) {
      // Avançar para resultados e calcular
      const voteCounts = new Map<Id<"players">, number>();
      for (const v of votes) {
        voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1);
      }

      let maxVotes = 0;
      let votedOutId: Id<"players"> | undefined;
      let isTie = false;

      for (const [suspect, count] of voteCounts.entries()) {
        if (count > maxVotes) {
          maxVotes = count;
          votedOutId = suspect;
          isTie = false;
        } else if (count === maxVotes) {
          isTie = true;
        }
      }

      const impostorWon = isTie || votedOutId !== round.impostorId;

      await ctx.db.patch(args.roundId, {
        status: "results",
        votedOutId: isTie ? undefined : votedOutId,
        impostorWon,
      });

      // Update scores
      if (impostorWon) {
        // Impostor gets points
        const impostor = await ctx.db.get(round.impostorId);
        if (impostor) {
          await ctx.db.patch(impostor._id, { score: impostor.score + 2 });
        }
      } else {
        // Group gets points
        for (const p of activePlayers) {
          if (p._id !== round.impostorId && p._id !== round.masterId) {
            await ctx.db.patch(p._id, { score: (p.score || 0) + 1 });
          }
        }
      }
    }
  },
});

export const getVotes = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
  },
});

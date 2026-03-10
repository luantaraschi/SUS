import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

export const submitAnswer = mutation({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    sessionId: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada não encontrada");
    if (round.status !== "answering") throw new Error("Não é hora de responder");

    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId || player.roomId !== round.roomId) {
      throw new Error("Jogador inválido");
    }

    // Check if player already answered
    const existing = await ctx.db
      .query("answers")
      .withIndex("by_round_player", (q) =>
        q.eq("roundId", args.roundId).eq("playerId", args.playerId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { text: args.answer, submittedAt: Date.now() });
    } else {
      await ctx.db.insert("answers", {
        roundId: args.roundId,
        playerId: args.playerId,
        text: args.answer,
        submittedAt: Date.now(),
      });
    }

    // Determine if all required players have answered
    const room = await ctx.db.get(round.roomId);
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = players.filter((p) => p.status !== "disconnected" && p._id !== round.masterId);
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (answers.length >= activePlayers.length) {
      // Avançar de fase
      if (room?.mode === "question") {
        await ctx.db.patch(args.roundId, { status: "revealing" });
      } else {
        await ctx.db.patch(args.roundId, { status: "voting" });
      }
    }
  },
});

import { query } from "./_generated/server.js";

export const getAnswersByRound = query({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    return ctx.db.query("answers").withIndex("by_round", q => q.eq("roundId", args.roundId)).collect();
  },
});

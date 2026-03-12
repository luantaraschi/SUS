import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.js";
import { mutation, query } from "./_generated/server.js";
import { attemptSaveHistory } from "./history.js";

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

    await checkAndTallyVotes(ctx, args.roundId);
  },
});

export async function checkAndTallyVotes(ctx: any, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);
  if (!round) return;

  const room = await ctx.db.get(round.roomId);
  if (!room) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q: any) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = players.filter((p: any) => p.status !== "disconnected" && p._id !== round.masterId);
  const votes = await ctx.db
    .query("votes")
    .withIndex("by_round", (q: any) => q.eq("roundId", roundId))
    .collect();

  if (votes.length >= activePlayers.length) {
    // Avançar para resultados e calcular
    const voteCounts = new Map<string, number>();
    for (const v of votes) {
      voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1);
    }

    let maxVotes = 0;
    let votedOutId: Id<"players"> | undefined;
    let isTie = false;

    for (const [suspect, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        votedOutId = suspect as Id<"players">;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    const impostorIds = round.impostorIds || (round.impostorId ? [round.impostorId] : []);
    const impostorWon = isTie || !impostorIds.includes(votedOutId);

    await ctx.db.patch(roundId, {
      status: "results",
      votedOutId: isTie ? undefined : votedOutId,
      impostorWon,
    });

    // Update scores
    if (impostorWon) {
      // Impostor gets points
      for (const impId of impostorIds) {
        const impostor = await ctx.db.get(impId as Id<"players">);
        if (impostor) {
          await ctx.db.patch(impostor._id, { score: impostor.score + 2 });
        }
      }
    } else {
      // Group gets points
      for (const p of activePlayers) {
        if (!impostorIds.includes(p._id) && p._id !== round.masterId) {
          await ctx.db.patch(p._id, { score: (p.score || 0) + 1 });
        }
      }
    }

    if (room.currentRound === room.settings.rounds) {
      await attemptSaveHistory(ctx, { roomId: room._id });
    }
  }
}

export async function castBotVotes(ctx: any, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);
  if (!round) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q: any) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = players.filter((p: any) => p.status !== "disconnected" && p._id !== round.masterId);
  const bots = activePlayers.filter((p: any) => p.isBot);

  if (bots.length === 0) return;

  for (const bot of bots) {
    // Check if the bot already voted
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_round_voter", (q: any) =>
        q.eq("roundId", roundId).eq("voterId", bot._id)
      )
      .first();

    if (!existing) {
      // Pick a random target from activePlayers (excluding self)
      const possibleTargets = activePlayers.filter((p: any) => p._id !== bot._id);
      if (possibleTargets.length > 0) {
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        await ctx.db.insert("votes", {
          roundId: roundId,
          voterId: bot._id,
          targetId: target._id,
        });
      }
    }
  }

  // After all bots vote, check if the round should end 
  // (e.g., if there are ONLY bots or they were the last remaining to vote)
  await checkAndTallyVotes(ctx, roundId);
}

export const getVotes = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
  },
});

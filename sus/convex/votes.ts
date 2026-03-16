import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.js";
import { mutation, query, type MutationCtx } from "./_generated/server.js";
import { finalizeRoundResultsInternal } from "./rounds.js";

type RoundDoc = Doc<"rounds">;
type PlayerDoc = Doc<"players">;

function getVotingPlayers(players: PlayerDoc[], round: RoundDoc) {
  return players.filter(
    (player) => player.status !== "disconnected" && player._id !== round.masterId
  );
}

export const submitVote = mutation({
  args: {
    roundId: v.id("rounds"),
    voterId: v.id("players"),
    sessionId: v.string(),
    suspectId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada nao encontrada.");
    if (round.status !== "voting") throw new Error("Nao e hora de votar.");

    const voter = await ctx.db.get(args.voterId);
    if (!voter || voter.roomId !== round.roomId) {
      throw new Error("Jogador invalido.");
    }
    if (!voter.isBot && voter.sessionId !== args.sessionId) {
      throw new Error("Sessao invalida.");
    }

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

export async function checkAndTallyVotes(ctx: MutationCtx, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);
  if (!round) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = getVotingPlayers(players, round);
  const votes = await ctx.db
    .query("votes")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();

  if (votes.length < activePlayers.length) {
    return;
  }
  await finalizeRoundResultsInternal(ctx, roundId);
}

export async function castBotVotes(ctx: MutationCtx, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);
  if (!round) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = getVotingPlayers(players, round);
  const bots = activePlayers.filter((player) => player.isBot);

  for (const bot of bots) {
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_round_voter", (q) => q.eq("roundId", roundId).eq("voterId", bot._id))
      .first();

    if (existing) {
      continue;
    }

    const possibleTargets = activePlayers.filter((player) => player._id !== bot._id);
    if (possibleTargets.length === 0) {
      continue;
    }

    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)]!;
    await ctx.db.insert("votes", {
      roundId,
      voterId: bot._id,
      targetId: target._id,
    });
  }

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

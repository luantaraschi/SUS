import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.js";
import { mutation, query, type MutationCtx } from "./_generated/server.js";
import { internal } from "./_generated/api.js";

type RoundDoc = Doc<"rounds">;
type PlayerDoc = Doc<"players">;

function getAnsweringPlayers(players: PlayerDoc[], round: RoundDoc) {
  return players.filter(
    (player) => player.status !== "disconnected" && !player.isSpectator && player._id !== round.masterId
  );
}

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

async function maybeAdvanceAfterAnswers(ctx: MutationCtx, round: RoundDoc, roundId: Id<"rounds">) {
  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = getAnsweringPlayers(players, round);
  const answers = await ctx.db
    .query("answers")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();

  if (answers.length < activePlayers.length) {
    return;
  }

  const room = await ctx.db.get(round.roomId);

  // Master mode: advance to evidence phase (no timer)
  if (room && isMasterQuestionMode(room)) {
    await ctx.db.patch(roundId, {
      status: "evidence",
      revealedAt: Date.now(),
      phaseEndsAt: undefined,
      evidenceReadyBy: [],
    });
    return;
  }

  // System/word mode: advance to revealing with timer
  const revealedAt = Date.now();
  await ctx.db.patch(roundId, {
    status: "revealing",
    revealedAt,
    phaseEndsAt: revealedAt + 8000,
  });
  await ctx.scheduler.runAfter(8000, internal.rounds.advancePhaseInternal, {
    roundId,
    expectedStatus: "revealing",
  });
}

export const submitAnswer = mutation({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    sessionId: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada nao encontrada.");
    if (round.status !== "answering") throw new Error("Nao e hora de responder.");

    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId || player.roomId !== round.roomId) {
      throw new Error("Jogador invalido.");
    }
    if (player.isSpectator) {
      throw new Error("Espectadores nao podem participar.");
    }

    const existing = await ctx.db
      .query("answers")
      .withIndex("by_round_player", (q) =>
        q.eq("roundId", args.roundId).eq("playerId", args.playerId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.answer,
        submittedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("answers", {
        roundId: args.roundId,
        playerId: args.playerId,
        text: args.answer,
        submittedAt: Date.now(),
      });
    }

    await maybeAdvanceAfterAnswers(ctx, round, args.roundId);
  },
});

export const getAnswersByRound = query({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || !["answering", "revealing", "evidence", "voting", "results"].includes(round.status)) {
      return [];
    }

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (round.status === "answering") {
      return answers.map((answer) => ({ ...answer, text: "***" }));
    }

    return answers;
  },
});

export async function castBotAnswers(ctx: MutationCtx, roundId: Id<"rounds">) {
  const round = await ctx.db.get(roundId);
  if (!round) return;

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
    .collect();

  const bots = getAnsweringPlayers(players, round).filter((player) => player.isBot);
  if (bots.length === 0) return;

  const fakeAnswers = ["Nao sei", "Acho que sim", "Depende", "Talvez", "Interessante"];

  for (const bot of bots) {
    const existing = await ctx.db
      .query("answers")
      .withIndex("by_round_player", (q) => q.eq("roundId", roundId).eq("playerId", bot._id))
      .first();

    if (!existing) {
      await ctx.db.insert("answers", {
        roundId,
        playerId: bot._id,
        text: chooseRandomItem(fakeAnswers),
        submittedAt: Date.now(),
      });
    }
  }

  await maybeAdvanceAfterAnswers(ctx, round, roundId);
}

function chooseRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

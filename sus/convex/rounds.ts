import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.js";
import { internal } from "./_generated/api.js";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server.js";
import { castBotVotes } from "./votes.js";
import { castBotAnswers } from "./answers.js";
import {
  getDefaultPackCount,
  getDefaultQuestionPack,
  getDefaultWordPack,
} from "./content.js";
import { attemptSaveHistory } from "./history.js";

type RoundPlayer = Doc<"players">;
type RoomDoc = Doc<"rooms">;
type RoundDoc = Doc<"rounds">;
type ContentCtx = MutationCtx | QueryCtx;
type RoundMode = RoomDoc["mode"];

type StartReadiness = {
  ready: boolean;
  message: string | null;
  source: "default" | "custom" | "master" | null;
  availableCount: number;
  mode: RoundMode;
};

type ResolvedRoundContent = {
  content: string;
  impostorContent: string | null;
  category: string | null;
};

function getActivePlayers(players: RoundPlayer[]) {
  return players.filter((player) => player.status !== "disconnected");
}

function getQuestionMode(room: RoomDoc) {
  return room.questionMode ?? "system";
}

function getRoundImpostorIds(round: RoundDoc) {
  return round.impostorIds ?? (round.impostorId ? [round.impostorId] : []);
}

function chooseRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

async function schedulePhaseAdvance(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  expectedStatus: "revealing" | "discussion" | "voting",
  delayMs: number
) {
  await ctx.scheduler.runAfter(delayMs, internal.rounds.advancePhaseInternal, {
    roundId,
    expectedStatus,
  });
}

async function enterDiscussion(
  ctx: MutationCtx,
  round: RoundDoc,
  room: RoomDoc
) {
  const phaseEndsAt = Date.now() + room.settings.discussionTime * 1000;
  await ctx.db.patch(round._id, {
    status: "discussion",
    phaseEndsAt,
  });
  await schedulePhaseAdvance(
    ctx,
    round._id,
    "discussion",
    room.settings.discussionTime * 1000
  );
}

async function enterVoting(
  ctx: MutationCtx,
  round: RoundDoc,
  room: RoomDoc
) {
  const phaseEndsAt = Date.now() + room.settings.votingTime * 1000;
  await ctx.db.patch(round._id, {
    status: "voting",
    phaseEndsAt,
  });
  await castBotVotes(ctx, round._id);
  await schedulePhaseAdvance(ctx, round._id, "voting", room.settings.votingTime * 1000);
}

export async function finalizeRoundResultsInternal(
  ctx: MutationCtx,
  roundId: Id<"rounds">
) {
  const round = await ctx.db.get(roundId);
  if (!round || round.status === "results") {
    return;
  }

  const room = await ctx.db.get(round.roomId);
  if (!room) {
    return;
  }

  const players = await ctx.db
    .query("players")
    .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
    .collect();

  const activePlayers = players.filter(
    (player) => player.status !== "disconnected" && player._id !== round.masterId
  );
  const votes = await ctx.db
    .query("votes")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();

  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) || 0) + 1);
  }

  let maxVotes = 0;
  let votedOutId: Id<"players"> | null = null;
  let isTie = false;

  for (const [suspectId, count] of voteCounts.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      votedOutId = suspectId as Id<"players">;
      isTie = false;
      continue;
    }

    if (count === maxVotes) {
      isTie = true;
    }
  }

  const impostorIds = getRoundImpostorIds(round);
  const resolvedVotedOutId = isTie ? null : votedOutId;
  const impostorWon =
    votes.length === 0 ||
    isTie ||
    !resolvedVotedOutId ||
    !impostorIds.includes(resolvedVotedOutId);

  await ctx.db.patch(roundId, {
    status: "results",
    votedOutId: resolvedVotedOutId ?? undefined,
    impostorWon,
    phaseEndsAt: undefined,
    resultReadyAt: Date.now(),
  });

  if (impostorWon) {
    for (const impostorId of impostorIds) {
      const impostor = await ctx.db.get(impostorId);
      if (impostor) {
        await ctx.db.patch(impostor._id, { score: impostor.score + 2 });
      }
    }
  } else {
    for (const player of activePlayers) {
      if (!impostorIds.includes(player._id)) {
        await ctx.db.patch(player._id, { score: player.score + 1 });
      }
    }
  }

  if (room.currentRound === room.settings.rounds) {
    await attemptSaveHistory(ctx, { roomId: room._id });
  }
}

export async function getRoomContentReadiness(
  ctx: ContentCtx,
  room: RoomDoc
): Promise<StartReadiness> {
  if (room.mode === "question" && getQuestionMode(room) === "master") {
    return {
      ready: true,
      message: null,
      source: "master",
      availableCount: 0,
      mode: room.mode,
    };
  }

  if (room.settings.customPackId) {
    const customPack = await ctx.db.get(room.settings.customPackId);
    if (!customPack) {
      return {
        ready: false,
        message: "O pacote customizado selecionado nao existe mais.",
        source: "custom",
        availableCount: 0,
        mode: room.mode,
      };
    }

    if (customPack.mode !== room.mode) {
      return {
        ready: false,
        message: "O pacote customizado nao corresponde ao modo atual da sala.",
        source: "custom",
        availableCount: customPack.items.length,
        mode: room.mode,
      };
    }

    if (customPack.items.length === 0) {
      return {
        ready: false,
        message: "O pacote customizado selecionado esta vazio.",
        source: "custom",
        availableCount: 0,
        mode: room.mode,
      };
    }

    return {
      ready: true,
      message: null,
      source: "custom",
      availableCount: customPack.items.length,
      mode: room.mode,
    };
  }

  const { count } = await getDefaultPackCount(
    ctx,
    room.mode,
    room.settings.defaultPackKey
  );

  if (count === 0) {
    return {
      ready: false,
      message: "Carregando packs padrao do sistema. Tente iniciar novamente em alguns instantes.",
      source: "default",
      availableCount: 0,
      mode: room.mode,
    };
  }

  return {
    ready: true,
    message: null,
    source: "default",
    availableCount: count,
    mode: room.mode,
  };
}

async function resolveRoundContent(
  ctx: MutationCtx,
  room: RoomDoc
): Promise<ResolvedRoundContent> {
  if (room.mode === "question" && getQuestionMode(room) === "master") {
    return {
      content: "",
      impostorContent: null,
      category: null,
    };
  }

  const readiness = await getRoomContentReadiness(ctx, room);
  if (!readiness.ready) {
    throw new Error(readiness.message ?? "Nao foi possivel preparar o conteudo da rodada.");
  }

  if (room.settings.customPackId) {
    const customPack = await ctx.db.get(room.settings.customPackId);
    if (!customPack || customPack.items.length === 0) {
      throw new Error("O pacote customizado selecionado esta indisponivel.");
    }

    const item = chooseRandomItem(customPack.items);
    return {
      content: item.content,
      impostorContent:
        room.mode === "word"
          ? room.settings.impostorHint
            ? item.hint || null
            : null
          : item.hint || null,
      category: customPack.title,
    };
  }

  if (room.mode === "word") {
    const pack = getDefaultWordPack(room.settings.defaultPackKey);
    const rows = (await ctx.db.query("wordPacks").collect()).filter(
      (entry) => entry.category === pack.title
    );
    const row = chooseRandomItem(rows);
    return {
      content: row.word,
      impostorContent: room.settings.impostorHint ? row.hint : null,
      category: pack.title,
    };
  }

  const pack = getDefaultQuestionPack(room.settings.defaultPackKey);
  const rows = (await ctx.db.query("questionPacks").collect()).filter(
    (entry) => entry.category === pack.title
  );
  const row = chooseRandomItem(rows);
  return {
    content: row.question,
    impostorContent: row.impostorQuestion,
    category: pack.title,
  };
}

export const getMyRole = query({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return null;

    const me = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", round.roomId).eq("sessionId", args.sessionId)
      )
      .first();

    if (!me) return null;

    const isImpostor = getRoundImpostorIds(round).includes(me._id);
    const masterImpostorIds =
      me.role === "master" ? getRoundImpostorIds(round).map((id) => id as string) : undefined;

    return {
      role: me.role ?? "player",
      secretContent: me.secretContent ?? null,
      isImpostor,
      masterImpostorIds,
    };
  },
});

export async function distributeRolesInternal(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  roundId: Id<"rounds">,
  activePlayers: RoundPlayer[],
  impostorIds: Id<"players">[],
  masterId: Id<"players"> | null
) {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error("Sala nao encontrada.");
  }

  const roundContent = await resolveRoundContent(ctx, room);

  await ctx.db.patch(roundId, {
    phaseEndsAt: undefined,
    revealedAt: undefined,
    resultReadyAt: undefined,
  });

  if (room.mode === "word") {
    await ctx.db.patch(roundId, {
      word: roundContent.content,
      hint: roundContent.impostorContent ?? undefined,
      category: roundContent.category,
    });
  } else if (getQuestionMode(room) === "system") {
    await ctx.db.patch(roundId, {
      questionMain: roundContent.content,
      questionImpostor: roundContent.impostorContent ?? undefined,
      category: roundContent.category,
    });
  } else {
    await ctx.db.patch(roundId, {
      category: roundContent.category,
    });
  }

  for (const player of activePlayers) {
    const basePatch = player.isBot ? { status: "ready" as const } : { status: "connected" as const };

    if (player._id === masterId) {
      await ctx.db.patch(player._id, {
        ...basePatch,
        role: "master",
        secretContent: null,
      });
      continue;
    }

    if (impostorIds.includes(player._id)) {
      await ctx.db.patch(player._id, {
        ...basePatch,
        role: "impostor",
        secretContent: roundContent.impostorContent,
      });
      continue;
    }

    await ctx.db.patch(player._id, {
      ...basePatch,
      role: "player",
      secretContent: roundContent.content,
    });
  }
}

export const getCurrentRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.currentRound === 0) return null;

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_room_number", (q) =>
        q.eq("roomId", args.roomId).eq("number", room.currentRound)
      )
      .first();

    if (!round) return null;

    const { impostorId, impostorIds, ...safeRound } = round;
    void impostorId;
    void impostorIds;
    return safeRound;
  },
});

export const getRoundResult = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "results") return null;

    return {
      impostorId: round.impostorId,
      impostorIds: getRoundImpostorIds(round),
      votedOutId: round.votedOutId,
      impostorWon: round.impostorWon,
      resultReadyAt: round.resultReadyAt ?? null,
    };
  },
});

export const confirmSeen = mutation({
  args: {
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada nao encontrada.");

    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId) {
      throw new Error("Jogador invalido.");
    }

    await ctx.db.patch(args.playerId, { status: "ready" });

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = getActivePlayers(players);
    const allReady = activePlayers.every((currentPlayer) => currentPlayer.status === "ready");

    if (!allReady) {
      return;
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) {
      throw new Error("Sala nao encontrada.");
    }

    for (const currentPlayer of activePlayers) {
      await ctx.db.patch(currentPlayer._id, { status: "connected" });
    }

    if (round.mode === "question") {
      await ctx.db.patch(args.roundId, {
        status: "answering",
        phaseEndsAt: undefined,
      });
      await castBotAnswers(ctx, args.roundId);
      return;
    }

    const updatedRound = (await ctx.db.get(args.roundId))!;
    await enterDiscussion(ctx, updatedRound, room);
  },
});

export const setMasterQuestions = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
    questionMain: v.string(),
    questionImpostor: v.string(),
    selectedImpostorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada nao encontrada.");

    const master = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", round.roomId).eq("sessionId", args.sessionId)
      )
      .first();

    if (!master || master._id !== round.masterId) {
      throw new Error("Nao autorizado.");
    }

    const questionMain = args.questionMain.trim();
    const questionImpostor = args.questionImpostor.trim();
    if (!questionMain || !questionImpostor) {
      throw new Error("Preencha as duas perguntas antes de continuar.");
    }

    await ctx.db.patch(args.roundId, {
      questionMain,
      questionImpostor,
    });

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    let finalImpostorIds = getRoundImpostorIds(round);
    if (args.selectedImpostorId) {
      const chosenPlayer = players.find(
        (player) => player._id === (args.selectedImpostorId as Id<"players">)
      );
      if (chosenPlayer && chosenPlayer._id !== master._id) {
        finalImpostorIds = [chosenPlayer._id];
        await ctx.db.patch(round._id, {
          impostorId: chosenPlayer._id,
          impostorIds: [chosenPlayer._id],
        });
      }
    }

    for (const player of players) {
      if (player._id === round.masterId) {
        continue;
      }

      await ctx.db.patch(player._id, {
        secretContent: finalImpostorIds.includes(player._id) ? questionImpostor : questionMain,
        role: finalImpostorIds.includes(player._id) ? "impostor" : "player",
      });
    }

    await ctx.db.patch(master._id, { status: "ready" });

    const updatedPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = getActivePlayers(updatedPlayers);
    if (!activePlayers.every((player) => player.status === "ready")) {
      return;
    }

    for (const player of activePlayers) {
      await ctx.db.patch(player._id, { status: "connected" });
    }

    await ctx.db.patch(args.roundId, {
      status: "answering",
      phaseEndsAt: undefined,
    });
    await castBotAnswers(ctx, args.roundId);
  },
});

export const advanceToVoting = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada nao encontrada.");

    const room = await ctx.db.get(round.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode avancar a fase.");
    }

    if (round.status === "revealing") {
      await enterDiscussion(ctx, round, room);
      return;
    }

    if (round.status === "discussion") {
      await enterVoting(ctx, round, room);
      return;
    }

    throw new Error("A rodada nao esta em uma fase avancavel manualmente.");
  },
});

export const recomputeResults = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Rodada nao encontrada.");
    }

    const room = await ctx.db.get(round.roomId);
    if (!room || room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode recomputar o resultado.");
    }

    await finalizeRoundResultsInternal(ctx, args.roundId);
  },
});

export const advancePhaseInternal = internalMutation({
  args: {
    roundId: v.id("rounds"),
    expectedStatus: v.union(
      v.literal("revealing"),
      v.literal("discussion"),
      v.literal("voting")
    ),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== args.expectedStatus) {
      return;
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) {
      return;
    }

    if (args.expectedStatus === "revealing") {
      await enterDiscussion(ctx, round, room);
      return;
    }

    if (args.expectedStatus === "discussion") {
      await enterVoting(ctx, round, room);
      return;
    }

    await finalizeRoundResultsInternal(ctx, args.roundId);
  },
});

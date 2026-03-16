import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.js";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server.js";
import { castBotVotes } from "./votes.js";
import { castBotAnswers } from "./answers.js";

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

  const defaultCount =
    room.mode === "word"
      ? (await ctx.db.query("wordPacks").collect()).length
      : (await ctx.db.query("questionPacks").collect()).length;

  if (defaultCount === 0) {
    return {
      ready: false,
      message:
        room.mode === "word"
          ? "O banco padrao de palavras esta vazio. Rode seed:seedData antes de iniciar."
          : "O banco padrao de perguntas esta vazio. Rode seed:seedData antes de iniciar.",
      source: "default",
      availableCount: 0,
      mode: room.mode,
    };
  }

  return {
    ready: true,
    message: null,
    source: "default",
    availableCount: defaultCount,
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
    const pack = chooseRandomItem(await ctx.db.query("wordPacks").collect());
    return {
      content: pack.word,
      impostorContent: room.settings.impostorHint ? pack.hint : null,
      category: pack.category,
    };
  }

  const pack = chooseRandomItem(await ctx.db.query("questionPacks").collect());
  return {
    content: pack.question,
    impostorContent: pack.impostorQuestion,
    category: pack.category,
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
  }

  for (const player of activePlayers) {
    const basePatch = player.isBot ? { status: "ready" as const } : {};

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

    await ctx.db.patch(args.roundId, {
      status: round.mode === "question" ? "answering" : "voting",
    });

    if (round.mode === "question") {
      await castBotAnswers(ctx, args.roundId);
    } else {
      await castBotVotes(ctx, args.roundId);
    }

    for (const currentPlayer of activePlayers) {
      await ctx.db.patch(currentPlayer._id, { status: "connected" });
    }
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

    await ctx.db.patch(args.roundId, { status: "answering" });
    await castBotAnswers(ctx, args.roundId);

    for (const player of activePlayers) {
      await ctx.db.patch(player._id, { status: "connected" });
    }
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
    if (round.status !== "revealing") {
      throw new Error("A rodada nao esta na fase de revelacao.");
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode avancar a fase.");
    }

    await ctx.db.patch(args.roundId, { status: "voting" });
    await castBotVotes(ctx, args.roundId);
  },
});

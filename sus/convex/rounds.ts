import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { Id } from "./_generated/dataModel.js";
import { castBotVotes } from "./votes.js";
import { castBotAnswers } from "./answers.js";

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

    const isImpostor = round.impostorIds?.includes(me._id) || round.impostorId === me._id;

    let masterImpostorIds: string[] | undefined = undefined;
    if (me.role === "master") {
      masterImpostorIds = round.impostorIds || (round.impostorId ? [round.impostorId] : []);
    }

    return {
      role: me.role ?? "player",
      secretContent: me.secretContent ?? null,
      isImpostor,
      masterImpostorIds,
    };
  },
});

export async function distributeRolesInternal(
  ctx: any,
  roomId: Id<"rooms">,
  roundId: Id<"rounds">,
  activePlayers: any[],
  impostorIds: Id<"players">[],
  masterId: Id<"players"> | null
) {
  const room = await ctx.db.get(roomId);
  if (!room) throw new Error("Sala não encontrada");

  // Fetch random word or question content depending on the mode
  let content = "";
  let impostorHint: string | null = null;
  let category: string | null = null;

  if (room.mode === "word") {
    if (room.settings.customPackId) {
      const customPack = await ctx.db.get(room.settings.customPackId);
      if (customPack && customPack.items.length > 0) {
        const item = customPack.items[Math.floor(Math.random() * customPack.items.length)];
        content = item.content;
        if (room.settings.impostorHint) {
          impostorHint = item.hint;
        }
        category = customPack.title;
      }
    }

    if (!content) {
      const packs = await ctx.db.query("wordPacks").collect();
      if (packs.length === 0) {
        throw new Error("Banco de palavras vazio. Rode a mutation seed:seedData primeiro.");
      }
      const pack = packs[Math.floor(Math.random() * packs.length)];
      content = pack.word;
      if (room.settings.impostorHint) {
        impostorHint = pack.hint;
      }
      category = pack.category;
    }

    await ctx.db.patch(roundId, {
      word: content,
      hint: impostorHint,
      category: category,
    });

  } else if (room.mode === "question" && room.questionMode === "system") {
    if (room.settings.customPackId) {
      const customPack = await ctx.db.get(room.settings.customPackId);
      if (customPack && customPack.items.length > 0) {
        const item = customPack.items[Math.floor(Math.random() * customPack.items.length)];
        content = item.content;
        impostorHint = item.hint;
        category = customPack.title;
      }
    }

    if (!content) {
      const packs = await ctx.db.query("questionPacks").collect();
      if (packs.length === 0) {
        throw new Error("Banco de perguntas vazio. Rode a mutation seed:seedData primeiro.");
      }
      const pack = packs[Math.floor(Math.random() * packs.length)];
      content = pack.question;
      impostorHint = pack.impostorQuestion;
      category = pack.category;
    }

    await ctx.db.patch(roundId, {
      questionMain: content,
      questionImpostor: impostorHint,
    });
  }

  for (const player of activePlayers) {
    const isBot = !!player.isBot;
    const basePatch = isBot ? { status: "ready" } : {};

    if (player._id === masterId) {
      await ctx.db.patch(player._id, { ...basePatch, role: "master", secretContent: null });
    } else if (impostorIds.includes(player._id)) {
      // Impostor gets the hint if available (or impostorQuestion)
      await ctx.db.patch(player._id, {
        ...basePatch,
        role: "impostor",
        secretContent: impostorHint,
      });
    } else {
      await ctx.db.patch(player._id, {
        ...basePatch,
        role: "player",
        secretContent: content,
      });
    }
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

    // Nunca expor impostorId na query padrão — usar getRoundResult para resultados
    const { impostorId, impostorIds, ...safeRound } = round;
    void impostorId;
    void impostorIds;
    return safeRound;
  },
});

// Retorna impostorId e dados de resultado SOMENTE quando round.status === "results"
export const getRoundResult = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return null;
    if (round.status !== "results") return null;

    return {
      impostorId: round.impostorId,
      impostorIds: round.impostorIds || (round.impostorId ? [round.impostorId] : []),
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
    if (!round) throw new Error("Rodada não encontrada");

    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId) {
      throw new Error("Jogador inválido");
    }

    // Marca como visto através do modo 'status == ready'
    await ctx.db.patch(args.playerId, { status: "ready" });

    // Verifica se todos viram
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = players.filter((p) => p.status !== "disconnected");
    const allReady = activePlayers.every((p) => p.status === "ready");

    if (allReady) {
      const mode = round.mode;
      await ctx.db.patch(args.roundId, {
        status: mode === "question" ? "answering" : "voting",
      });
      
      if (mode !== "question") {
        await castBotVotes(ctx, args.roundId);
      } else {
        await castBotAnswers(ctx, args.roundId);
      }

      // Reset players status to connected for the next phase
      for (const p of activePlayers) {
        await ctx.db.patch(p._id, { status: "connected" });
      }
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
    if (!round) throw new Error("Rodada nao encontrada");

    const master = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", round.roomId).eq("sessionId", args.sessionId)
      )
      .first();

    if (!master || master._id !== round.masterId) throw new Error("Nao autorizado");

    await ctx.db.patch(args.roundId, {
      questionMain: args.questionMain,
      questionImpostor: args.questionImpostor,
    });

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    let finalImpostorIds = round.impostorIds || (round.impostorId ? [round.impostorId] : []);

    if (args.selectedImpostorId) {
      const chosenPlayer = players.find(p => p._id === args.selectedImpostorId);
      if (chosenPlayer && chosenPlayer._id !== master._id) {
        finalImpostorIds = [chosenPlayer._id];
        await ctx.db.patch(round._id, { 
          impostorId: chosenPlayer._id, 
          impostorIds: [chosenPlayer._id] 
        });
      }
    }

    const impostorIdsList = finalImpostorIds;
    for (const player of players) {
      if (impostorIdsList.includes(player._id)) {
        await ctx.db.patch(player._id, { 
          secretContent: args.questionImpostor,
          role: "impostor"
        });
      } else if (player._id !== round.masterId) {
        // Demote existing impostors if they were overridden
        await ctx.db.patch(player._id, { 
          secretContent: args.questionMain,
          role: "player"
        });
      }
    }

    await ctx.db.patch(master._id, { status: "ready" });

    // Verificamos se agora todos (incluindo o mestre) estão prontos
    const updatedPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = updatedPlayers.filter((p: any) => p.status !== "disconnected");
    const allReady = activePlayers.every((p: any) => p.status === "ready");

    if (allReady) {
      await ctx.db.patch(args.roundId, {
        status: "answering",
      });

      await castBotAnswers(ctx, args.roundId);

      // Reset players status to connected for the next phase
      for (const p of activePlayers) {
        await ctx.db.patch(p._id, { status: "connected" });
      }
    }
  },
});

// Avança a rodada de "revealing" para "voting" — apenas o host pode chamar
export const advanceToVoting = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada não encontrada");
    if (round.status !== "revealing") {
      throw new Error("A rodada não está na fase de revelação");
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) throw new Error("Sala não encontrada");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode avançar a fase");
    }

    await ctx.db.patch(args.roundId, { status: "voting" });
    await castBotVotes(ctx, args.roundId);
  },
});

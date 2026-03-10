import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

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

    const isImpostor = round.impostorId === me._id;

    return {
      role: me.role ?? "player",
      secretContent: me.secretContent ?? null,
      isImpostor,
    };
  },
});

export const distributeRoles = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Rodada não encontrada");

    const room = await ctx.db.get(round.roomId);
    if (!room) throw new Error("Sala não encontrada");
    if (room.hostId !== args.sessionId) throw new Error("Apenas host pode distribuir papéis");

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
      .collect();

    const activePlayers = players.filter((p) => p.status !== "disconnected");

    // Fetch random word or question content depending on the mode
    let content = "Indefinido";
    let impostorHint: string | null = null;
    let category: string | null = null;

    if (room.mode === "word") {
      const packs = await ctx.db.query("wordPacks").collect();
      if (packs.length > 0) {
        const pack = packs[Math.floor(Math.random() * packs.length)];
        content = pack.word;
        if (room.settings.impostorHint) {
          impostorHint = pack.hint;
        }
        category = pack.category;
      }
      
      await ctx.db.patch(args.roundId, {
        word: content,
        hint: impostorHint,
        category: category,
      });

    } else if (room.mode === "question" && room.questionMode === "system") {
      const packs = await ctx.db.query("questionPacks").collect();
      if (packs.length > 0) {
        const pack = packs[Math.floor(Math.random() * packs.length)];
        content = pack.question;
        impostorHint = pack.impostorQuestion;
        category = pack.category;
      }
      
      await ctx.db.patch(args.roundId, {
        questionMain: content,
        questionImpostor: impostorHint,
      });
    }

    for (const player of activePlayers) {
      if (player._id === round.masterId) {
        await ctx.db.patch(player._id, { role: "master", secretContent: null });
      } else if (player._id === round.impostorId) {
        // Impostor gets the hint if available (or impostorQuestion)
        await ctx.db.patch(player._id, { 
          role: "impostor", 
          secretContent: impostorHint 
        });
      } else {
        await ctx.db.patch(player._id, { 
          role: "player", 
          secretContent: content 
        });
      }
    }
  },
});

export const getCurrentRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.currentRound === 0) return null;

    return ctx.db
      .query("rounds")
      .withIndex("by_room_number", (q) =>
        q.eq("roomId", args.roomId).eq("number", room.currentRound)
      )
      .first();
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

    for (const player of players) {
      if (player._id === round.impostorId) {
        await ctx.db.patch(player._id, { secretContent: args.questionImpostor });
      } else if (player._id !== round.masterId) {
        await ctx.db.patch(player._id, { secretContent: args.questionMain });
      }
    }
  },
});

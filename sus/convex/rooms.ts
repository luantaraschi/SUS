import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.js";
import { mutation, query } from "./_generated/server.js";
import { generateUniqueCode } from "./lib/generateCode.js";
import { distributeRolesInternal, getRoomContentReadiness } from "./rounds.js";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

const EMOJI_POOL = [
  "😱",
  "🤡",
  "👻",
  "🎭",
  "🤖",
  "👽",
  "🐙",
  "🦊",
  "🐸",
  "🦄",
  "🌶️",
  "🍄",
];

const BOT_PRESETS = [
  { name: "Nina", avatarSeed: "bot-nina" },
  { name: "Otto", avatarSeed: "bot-otto" },
  { name: "Luma", avatarSeed: "bot-luma" },
  { name: "Kiro", avatarSeed: "bot-kiro" },
  { name: "Moka", avatarSeed: "bot-moka" },
  { name: "Timo", avatarSeed: "bot-timo" },
  { name: "Zuri", avatarSeed: "bot-zuri" },
  { name: "Bibi", avatarSeed: "bot-bibi" },
  { name: "Nox", avatarSeed: "bot-nox" },
  { name: "Pip", avatarSeed: "bot-pip" },
  { name: "Yumi", avatarSeed: "bot-yumi" },
  { name: "Rex", avatarSeed: "bot-rex" },
];

type PlayerDoc = Doc<"players">;
type RoomDoc = Doc<"rooms">;

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function createBotSessionId(roomId: string): string {
  return `bot:${roomId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function getActivePlayers(players: PlayerDoc[]) {
  return players.filter((player) => player.status !== "disconnected");
}

function getDefaultPlayerName(name: string) {
  return name || `Anonimo${Math.floor(Math.random() * 999)}`;
}

function getDefaultAvatarSeed(seed: string) {
  return seed || getRandomItem(EMOJI_POOL);
}

function getBotProfile(players: Pick<PlayerDoc, "name" | "isBot" | "status">[]) {
  const activeNames = new Set(
    players
      .filter((player) => player.status !== "disconnected")
      .map((player) => player.name.toLowerCase())
  );

  const availablePresets = BOT_PRESETS.filter(
    (preset) => !activeNames.has(preset.name.toLowerCase())
  );

  if (availablePresets.length > 0) {
    return getRandomItem(availablePresets);
  }

  const botCount = players.filter((player) => player.isBot).length + 1;
  return {
    name: `Bot ${botCount}`,
    avatarSeed: `bot-fallback-${botCount}`,
  };
}

function pickImpostorIds(activePlayers: PlayerDoc[], requestedCount: number) {
  const impostorIds: Id<"players">[] = [];
  const availableIndices = Array.from({ length: activePlayers.length }, (_, index) => index);
  const maxImpostors = Math.max(1, Math.min(requestedCount, activePlayers.length - 1));

  for (let index = 0; index < maxImpostors; index += 1) {
    const randomListIndex = Math.floor(Math.random() * availableIndices.length);
    const pickedPlayerIndex = availableIndices.splice(randomListIndex, 1)[0];
    impostorIds.push(activePlayers[pickedPlayerIndex]!._id);
  }

  return impostorIds;
}

function resolveMasterId(room: RoomDoc, activePlayers: PlayerDoc[], impostorIds: Id<"players">[]) {
  if (room.mode !== "question" || (room.questionMode ?? "system") !== "master") {
    return null;
  }

  const hostPlayer = activePlayers.find((player) => player.isHost) ?? null;
  const specifiedMaster =
    activePlayers.find((player) => player._id === room.settings.customMasterId) ?? null;

  let candidateMaster = specifiedMaster ?? hostPlayer;
  if (!candidateMaster) {
    return null;
  }

  if (impostorIds.includes(candidateMaster._id)) {
    const fallbackCandidates = activePlayers.filter(
      (player) => !impostorIds.includes(player._id)
    );
    candidateMaster =
      fallbackCandidates.length > 0 ? getRandomItem(fallbackCandidates) : null;
  }

  if (!candidateMaster || impostorIds.includes(candidateMaster._id)) {
    return null;
  }

  return candidateMaster._id;
}

export const createRoom = mutation({
  args: {
    hostName: v.string(),
    hostEmoji: v.string(),
    hostAvatarImageUrl: v.optional(v.string()),
    mode: v.union(v.literal("word"), v.literal("question")),
    settings: v.optional(
      v.object({
        maxPlayers: v.optional(v.number()),
        rounds: v.optional(v.number()),
        discussionTime: v.optional(v.number()),
        votingTime: v.optional(v.number()),
        impostorHint: v.optional(v.boolean()),
        isLocalMode: v.optional(v.boolean()),
        customMasterId: v.optional(v.string()),
      })
    ),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const code = await generateUniqueCode(ctx, 4);

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: args.sessionId,
      mode: args.mode,
      status: "lobby",
      settings: {
        maxPlayers: args.settings?.maxPlayers ?? 8,
        rounds: args.settings?.rounds ?? 3,
        discussionTime: args.settings?.discussionTime ?? 120,
        votingTime: args.settings?.votingTime ?? 60,
        impostorHint: args.settings?.impostorHint ?? false,
        isLocalMode: args.settings?.isLocalMode ?? false,
        customMasterId: undefined,
      },
      currentRound: 0,
    });

    const playerId = await ctx.db.insert("players", {
      roomId,
      sessionId: args.sessionId,
      name: getDefaultPlayerName(args.hostName),
      emoji: getDefaultAvatarSeed(args.hostEmoji),
      avatarImageUrl: args.hostAvatarImageUrl,
      isHost: true,
      isBot: false,
      status: "connected",
      score: 0,
      joinedAt: Date.now(),
    });

    return { roomId, code, playerId };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    playerName: v.string(),
    playerEmoji: v.string(),
    playerAvatarImageUrl: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase().trim();

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!room) {
      throw new Error("Sala nao encontrada. Verifique o codigo e tente novamente.");
    }

    if (room.status !== "lobby") {
      throw new Error("Esta sala ja esta em jogo. Aguarde a proxima partida.");
    }

    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", room._id).eq("sessionId", args.sessionId)
      )
      .first();

    if (existingPlayer) {
      await ctx.db.patch(existingPlayer._id, { status: "connected" });
      return { roomId: room._id, playerId: existingPlayer._id };
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    const activePlayers = getActivePlayers(players);
    const replacementBot =
      activePlayers.length >= room.settings.maxPlayers
        ? activePlayers
            .filter((player) => player.isBot)
            .sort((left, right) => right.joinedAt - left.joinedAt)[0] ?? null
        : null;

    if (activePlayers.length >= room.settings.maxPlayers && !replacementBot) {
      throw new Error("Sala cheia! O maximo de jogadores foi atingido.");
    }

    const normalizedName = args.playerName.toLowerCase();
    const nameExists = activePlayers.some(
      (player) =>
        player._id !== replacementBot?._id && player.name.toLowerCase() === normalizedName
    );

    if (nameExists) {
      throw new Error("Ja existe um jogador com esse nome nesta sala.");
    }

    if (replacementBot) {
      await ctx.db.delete(replacementBot._id);
    }

    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      sessionId: args.sessionId,
      name: getDefaultPlayerName(args.playerName),
      emoji: getDefaultAvatarSeed(args.playerEmoji),
      avatarImageUrl: args.playerAvatarImageUrl,
      isHost: false,
      isBot: false,
      status: "connected",
      score: 0,
      joinedAt: Date.now(),
    });

    return { roomId: room._id, playerId };
  },
});

export const leaveRoom = mutation({
  args: {
    playerId: v.id("players"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId) return;

    const room = await ctx.db.get(player.roomId);
    if (!room) return;

    await ctx.db.delete(args.playerId);

    const remaining = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    const remainingHumans = remaining.filter((candidate) => !candidate.isBot);

    if (remainingHumans.length === 0) {
      for (const candidate of remaining) {
        await ctx.db.delete(candidate._id);
      }
      await ctx.db.delete(room._id);
      return;
    }

    if (player.isHost) {
      const connectedHumans = remainingHumans.filter(
        (candidate) => candidate.status !== "disconnected"
      );
      const hostCandidates =
        connectedHumans.length > 0 ? connectedHumans : remainingHumans;
      const nextHost = hostCandidates.sort((left, right) => left.joinedAt - right.joinedAt)[0]!;

      await ctx.db.patch(nextHost._id, { isHost: true });
      await ctx.db.patch(room._id, { hostId: nextHost.sessionId });
    }
  },
});

export const updateSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
    settings: v.object({
      maxPlayers: v.optional(v.number()),
      rounds: v.optional(v.number()),
      discussionTime: v.optional(v.number()),
      votingTime: v.optional(v.number()),
      impostorHint: v.optional(v.boolean()),
      isLocalMode: v.optional(v.boolean()),
      customMasterId: v.optional(v.string()),
      customPackId: v.optional(v.id("customPacks")),
      numImpostors: v.optional(v.number()),
    }),
    mode: v.optional(v.union(v.literal("word"), v.literal("question"))),
    questionMode: v.optional(v.union(v.literal("system"), v.literal("master"))),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode alterar configuracoes.");
    }
    if (room.status !== "lobby") {
      throw new Error("Configuracoes so podem ser alteradas no lobby.");
    }

    const merged = { ...room.settings };

    if (args.settings.maxPlayers !== undefined) {
      const players = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
      const activeCount = getActivePlayers(players).length;
      const minimumMaxPlayers = Math.max(MIN_PLAYERS, activeCount);

      merged.maxPlayers = Math.max(
        minimumMaxPlayers,
        Math.min(MAX_PLAYERS, args.settings.maxPlayers)
      );
      if (merged.numImpostors !== undefined) {
        merged.numImpostors = Math.max(1, Math.min(3, merged.maxPlayers - 2, merged.numImpostors));
      }
    }
    if (args.settings.rounds !== undefined) {
      merged.rounds = Math.max(1, Math.min(10, args.settings.rounds));
    }
    if (args.settings.discussionTime !== undefined) {
      merged.discussionTime = Math.max(30, Math.min(300, args.settings.discussionTime));
    }
    if (args.settings.votingTime !== undefined) {
      merged.votingTime = Math.max(15, Math.min(120, args.settings.votingTime));
    }
    if (args.settings.impostorHint !== undefined) {
      merged.impostorHint = args.settings.impostorHint;
    }
    if (args.settings.isLocalMode !== undefined) {
      merged.isLocalMode = args.settings.isLocalMode;
    }
    if (args.settings.customMasterId !== undefined) {
      merged.customMasterId = args.settings.customMasterId;
    }
    if (args.settings.customPackId !== undefined) {
      merged.customPackId = args.settings.customPackId;
    }
    if (args.settings.numImpostors !== undefined) {
      merged.numImpostors = Math.max(
        1,
        Math.min(3, merged.maxPlayers - 2, args.settings.numImpostors)
      );
    }

    const patch: Partial<RoomDoc> & { settings: RoomDoc["settings"] } = { settings: merged };
    if (args.mode) {
      patch.mode = args.mode;
      if (args.mode !== room.mode) {
        patch.settings = { ...patch.settings, customPackId: undefined };
      }
    }
    if (args.questionMode) {
      patch.questionMode = args.questionMode;
    }

    await ctx.db.patch(args.roomId, patch);
  },
});

export const kickPlayer = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode remover jogadores.");
    }

    const target = await ctx.db.get(args.targetPlayerId);
    if (!target || target.roomId !== args.roomId) return;
    if (target.isHost) throw new Error("O host nao pode ser removido.");

    await ctx.db.delete(args.targetPlayerId);
  },
});

export const addBot = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode adicionar bots.");
    }
    if (room.status !== "lobby") {
      throw new Error("Bots so podem ser adicionados no lobby.");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const activePlayers = getActivePlayers(players);

    if (activePlayers.length >= room.settings.maxPlayers) {
      throw new Error("A sala ja atingiu o limite de jogadores.");
    }

    const profile = getBotProfile(players);
    const playerId = await ctx.db.insert("players", {
      roomId: args.roomId,
      sessionId: createBotSessionId(args.roomId),
      name: profile.name,
      emoji: profile.avatarSeed,
      isHost: false,
      isBot: true,
      status: "connected",
      score: 0,
      joinedAt: Date.now(),
    });

    return { playerId };
  },
});

export const removeBot = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
    botPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode remover bots.");
    }
    if (room.status !== "lobby") {
      throw new Error("Bots so podem ser removidos no lobby.");
    }

    const botPlayer = await ctx.db.get(args.botPlayerId);
    if (!botPlayer || botPlayer.roomId !== args.roomId || !botPlayer.isBot) {
      throw new Error("Bot nao encontrado.");
    }

    await ctx.db.delete(botPlayer._id);
  },
});

export const checkRoomExists = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase().trim();
    if (code.length < 4) return false;

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    return !!room && room.status === "lobby";
  },
});

export const getStartReadiness = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return {
        ready: false,
        message: "Sala nao encontrada.",
        source: null,
        availableCount: 0,
        mode: "word" as const,
      };
    }

    return await getRoomContentReadiness(ctx, room);
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.hostId !== args.sessionId) {
      throw new Error("Apenas o host pode iniciar a partida.");
    }
    if (room.status !== "lobby") {
      throw new Error("A sala ja esta em jogo.");
    }

    const readiness = await getRoomContentReadiness(ctx, room);
    if (!readiness.ready) {
      throw new Error(readiness.message ?? "A sala nao esta pronta para iniciar.");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const activePlayers = getActivePlayers(players);
    if (activePlayers.length < MIN_PLAYERS) {
      throw new Error(
        `E necessario pelo menos ${MIN_PLAYERS} jogadores para iniciar a partida.`
      );
    }

    const impostorIds = pickImpostorIds(activePlayers, room.settings.numImpostors || 1);
    const masterId = resolveMasterId(room, activePlayers, impostorIds);

    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      number: 1,
      mode: room.mode,
      status: "distributing",
      impostorId: impostorIds[0],
      impostorIds,
      masterId,
    });

    await distributeRolesInternal(ctx, args.roomId, roundId, activePlayers, impostorIds, masterId);

    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentRound: 1,
    });

    return { roundId };
  },
});

export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase().trim();
    if (code.length < 4) return null;

    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
  },
});

export const getPlayers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return players
      .sort((left, right) => left.joinedAt - right.joinedAt)
      .map((player) => ({
        _id: player._id,
        _creationTime: player._creationTime,
        roomId: player.roomId,
        sessionId: player.sessionId,
        name: player.name,
        emoji: player.emoji,
        avatarImageUrl: player.avatarImageUrl ?? null,
        isHost: player.isHost,
        isBot: player.isBot,
        status: player.status,
        score: player.score,
        joinedAt: player.joinedAt,
      }));
  },
});

export const getMyPlayer = query({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", args.roomId).eq("sessionId", args.sessionId)
      )
      .first();
  },
});

export const getRoomState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    let currentRound = null;
    if (room.currentRound > 0) {
      const round = await ctx.db
        .query("rounds")
        .withIndex("by_room_number", (q) =>
          q.eq("roomId", args.roomId).eq("number", room.currentRound)
        )
        .first();

      if (round) {
        const { impostorId, ...safeRound } = round;
        void impostorId;
        currentRound = round.status === "results" ? round : safeRound;
      }
    }

    return {
      room,
      players: players.sort((left, right) => left.joinedAt - right.joinedAt),
      currentRound,
    };
  },
});

export const startNextRound = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Sala nao encontrada.");
    if (room.status !== "playing") throw new Error("Sala nao esta em jogo.");

    const caller = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", args.roomId).eq("sessionId", args.sessionId)
      )
      .first();
    if (!caller) throw new Error("Jogador nao encontrado.");

    const nextNumber = room.currentRound + 1;
    if (nextNumber > room.settings.rounds) {
      await ctx.db.patch(args.roomId, { status: "finished" });
      return { finished: true };
    }

    const readiness = await getRoomContentReadiness(ctx, room);
    if (!readiness.ready) {
      throw new Error(readiness.message ?? "A sala nao esta pronta para a proxima rodada.");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const activePlayers = getActivePlayers(players);

    for (const player of activePlayers) {
      await ctx.db.patch(player._id, { role: undefined, secretContent: undefined });
    }

    const impostorIds = pickImpostorIds(activePlayers, room.settings.numImpostors || 1);
    const masterId = resolveMasterId(room, activePlayers, impostorIds);

    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      number: nextNumber,
      mode: room.mode,
      status: "distributing",
      impostorId: impostorIds[0],
      impostorIds,
      masterId,
    });

    await distributeRolesInternal(ctx, args.roomId, roundId, activePlayers, impostorIds, masterId);

    await ctx.db.patch(args.roomId, {
      currentRound: nextNumber,
    });

    return { finished: false };
  },
});

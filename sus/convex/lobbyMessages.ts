import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.js";
import { mutation, query, type MutationCtx } from "./_generated/server.js";

const MAX_LOBBY_MESSAGES = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function clearLobbyMessagesForRoom(
  ctx: MutationCtx,
  roomId: Id<"rooms">
) {
  const messages = await ctx.db
    .query("lobby_messages")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

  for (const message of messages) {
    await ctx.db.delete(message._id);
  }
}

export const getLobbyMessages = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("lobby_messages")
      .withIndex("by_room_createdAt", (q) => q.eq("roomId", args.roomId))
      .collect();

    return messages.slice(-MAX_LOBBY_MESSAGES);
  },
});

export const sendLobbyMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    sessionId: v.string(),
    text: v.string(),
    x: v.number(),
    y: v.number(),
    rotation: v.number(),
    color: v.union(
      v.literal("butter"),
      v.literal("mint"),
      v.literal("sky"),
      v.literal("peach")
    ),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Sala nao encontrada.");
    }

    if (room.mode !== "question" || (room.questionMode ?? "system") !== "master") {
      throw new Error("O mural anonimo so existe no modo Mestre cria.");
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_room_session", (q) =>
        q.eq("roomId", args.roomId).eq("sessionId", args.sessionId)
      )
      .first();

    if (!player || player.status === "disconnected") {
      throw new Error("Jogador invalido.");
    }

    const round =
      room.currentRound > 0
        ? await ctx.db
            .query("rounds")
            .withIndex("by_room_number", (q) =>
              q.eq("roomId", args.roomId).eq("number", room.currentRound)
            )
            .first()
        : null;

    if (!round || round.status !== "distributing") {
      throw new Error("O mural anonimo nao esta disponivel agora.");
    }

    if (player._id === round.masterId) {
      throw new Error("O mestre nao pode enviar recados anonimos.");
    }

    const text = args.text.trim().slice(0, 60);
    if (!text) {
      throw new Error("Digite um recado antes de enviar.");
    }

    await ctx.db.insert("lobby_messages", {
      roomId: args.roomId,
      text,
      x: clamp(args.x, 6, 78),
      y: clamp(args.y, 8, 64),
      rotation: clamp(args.rotation, -6, 6),
      color: args.color,
      createdAt: Date.now(),
    });

    const messages = await ctx.db
      .query("lobby_messages")
      .withIndex("by_room_createdAt", (q) => q.eq("roomId", args.roomId))
      .collect();

    const overflow = messages.length - MAX_LOBBY_MESSAGES;
    if (overflow > 0) {
      for (const message of messages.slice(0, overflow)) {
        await ctx.db.delete(message._id);
      }
    }
  },
});

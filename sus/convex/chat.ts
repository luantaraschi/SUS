import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    sessionId: v.string(),
    text: v.string(),
    isEmoji: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (
      !player ||
      player.sessionId !== args.sessionId ||
      player.roomId !== args.roomId
    ) {
      throw new Error("Jogador invalido.");
    }

    const trimmed = args.text.trim().slice(0, 100);
    if (!trimmed) return;

    await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      playerId: args.playerId,
      playerName: player.name,
      playerEmoji: player.emoji,
      text: trimmed,
      isEmoji: args.isEmoji,
      sentAt: Date.now(),
    });
  },
});

export const getRecentMessages = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(20);
  },
});

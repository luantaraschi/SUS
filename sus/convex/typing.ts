import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

export const setTyping = mutation({
  args: {
    roomId: v.id("rooms"),
    playerId: v.id("players"),
    sessionId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId) return;

    const existing = await ctx.db
      .query("typingState")
      .withIndex("by_room_player", (q) =>
        q.eq("roomId", args.roomId).eq("playerId", args.playerId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingState", {
        roomId: args.roomId,
        playerId: args.playerId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTypingPlayers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("typingState")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const cutoff = Date.now() - 5000;
    return states
      .filter((s) => s.isTyping && s.updatedAt > cutoff)
      .map((s) => s.playerId);
  },
});

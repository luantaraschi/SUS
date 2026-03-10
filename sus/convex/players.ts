import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

export const updateStatus = mutation({
  args: {
    playerId: v.id("players"),
    sessionId: v.string(),
    status: v.union(
      v.literal("connected"),
      v.literal("ready"),
      v.literal("disconnected")
    ),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || player.sessionId !== args.sessionId) {
      return;
    }

    await ctx.db.patch(args.playerId, { status: args.status });
  },
});

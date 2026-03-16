import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { auth } from "./auth.js";

const DEFAULT_PREFERENCES = {
  colorScheme: "system" as const,
  backgroundThemeId: "classico",
  backgroundAnimationEnabled: true,
};

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return preferences ?? { userId, ...DEFAULT_PREFERENCES, updatedAt: 0 };
  },
});

export const update = mutation({
  args: {
    colorScheme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    backgroundThemeId: v.string(),
    backgroundAnimationEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Apenas usuarios logados podem salvar preferencias.");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const patch = {
      userId,
      colorScheme: args.colorScheme,
      backgroundThemeId: args.backgroundThemeId,
      backgroundAnimationEnabled: args.backgroundAnimationEnabled,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return { ...existing, ...patch };
    }

    const id = await ctx.db.insert("userPreferences", patch);
    return { _id: id, ...patch };
  },
});

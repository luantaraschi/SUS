import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    const identity = await ctx.auth.getUserIdentity();
    console.log("Debug Auth - userId:", userId, "identity:", identity?.subject || "no identity");
    
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    console.log("Debug Auth - user found in DB:", !!user);
    return user;
  },
});

export const linkSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }

    // In a more complex app we could query existing players by sessionId
    // and update them to use the userId. 
    // Here we just make sure there's a link if we need it later.
    // However, users table schema is controlled by Convex Auth,
    // so we might need a separate table to store user settings/metadata,
    // or just rely on passing the auth.getUserId(ctx) whenever they are logged in.
    return { success: true, userId };
  },
});

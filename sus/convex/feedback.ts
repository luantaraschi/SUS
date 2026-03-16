import { v } from "convex/values";
import { mutation } from "./_generated/server.js";
import { auth } from "./auth.js";

export const submitBugReport = mutation({
  args: {
    sessionId: v.string(),
    route: v.string(),
    browserInfo: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedMessage = args.message.trim();
    if (trimmedMessage.length < 10) {
      throw new Error("Descreva o bug com pelo menos 10 caracteres.");
    }

    const userId = await auth.getUserId(ctx);
    const reportId = await ctx.db.insert("bugReports", {
      userId: userId ?? undefined,
      sessionId: args.sessionId,
      route: args.route.trim(),
      browserInfo: args.browserInfo.trim(),
      message: trimmedMessage.slice(0, 2000),
      createdAt: Date.now(),
    });

    return { reportId };
  },
});

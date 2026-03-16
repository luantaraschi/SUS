import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server.js";
import { auth } from "./auth.js";
import { getDefaultPackCatalog } from "./content.js";

async function buildDefaultPackOptions(
  ctx: QueryCtx,
  mode: "word" | "question"
) {
  const catalog = getDefaultPackCatalog(mode);
  const entries =
    mode === "word"
      ? await ctx.db.query("wordPacks").collect()
      : await ctx.db.query("questionPacks").collect();

  return catalog.map((pack) => ({
    key: pack.key,
    title: pack.title,
    icon: pack.icon,
    source: "default" as const,
    count: entries.filter((entry) => entry.category === pack.title).length,
  }));
}

export const getMyPacks = query({
  args: { mode: v.optional(v.union(v.literal("word"), v.literal("question"))) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const packsQuery = ctx.db
      .query("customPacks")
      .withIndex("by_author", (q) => q.eq("authorId", userId));

    const packs = await packsQuery.order("desc").collect();

    if (args.mode) {
      return packs.filter((p) => p.mode === args.mode);
    }
    return packs;
  },
});

export const getDefaultPacks = query({
  args: { mode: v.union(v.literal("word"), v.literal("question")) },
  handler: async (ctx, args) => buildDefaultPackOptions(ctx, args.mode),
});

export const getMergedPackOptions = query({
  args: { mode: v.union(v.literal("word"), v.literal("question")) },
  handler: async (ctx, args) => {
    const defaultPacks = await buildDefaultPackOptions(ctx, args.mode);
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return defaultPacks;
    }

    const customPacks = await ctx.db
      .query("customPacks")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();

    return [
      ...defaultPacks,
      ...customPacks
        .filter((pack) => pack.mode === args.mode)
        .map((pack) => ({
          key: pack._id,
          title: pack.title,
          icon: "folder",
          source: "custom" as const,
          count: pack.items.length,
        })),
    ];
  },
});

export const createPack = mutation({
  args: {
    title: v.string(),
    mode: v.union(v.literal("word"), v.literal("question")),
    items: v.array(
      v.object({
        content: v.string(),
        hint: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Apenas usuários logados podem criar packs.");

    if (args.items.length === 0) {
      throw new Error("O pack precisa ter pelo menos um item.");
    }

    const packId = await ctx.db.insert("customPacks", {
      authorId: userId,
      title: args.title,
      mode: args.mode,
      items: args.items,
      createdAt: Date.now(),
    });

    return packId;
  },
});

export const deletePack = mutation({
  args: { packId: v.id("customPacks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Não autorizado.");

    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack não encontrado.");

    if (pack.authorId !== userId) {
      throw new Error("Você só pode deletar seus próprios packs.");
    }

    await ctx.db.delete(args.packId);
  },
});

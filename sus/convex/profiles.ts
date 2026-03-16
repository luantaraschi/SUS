import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel.js";
import { mutation, query } from "./_generated/server.js";
import { auth } from "./auth.js";

const MAX_NAME_LENGTH = 20;

function getFallbackDisplayName(user: Doc<"users">): string {
  const trimmedName = user.name?.trim();
  if (trimmedName) {
    return trimmedName.slice(0, MAX_NAME_LENGTH);
  }

  const emailPrefix = user.email?.split("@")[0]?.trim();
  if (emailPrefix) {
    return emailPrefix.slice(0, MAX_NAME_LENGTH);
  }

  return "Conta";
}

function getFallbackAvatarSeed(user: Doc<"users">, displayName: string): string {
  const basis = displayName || user.name || user.email || user._id;
  return basis.slice(0, 32) || user._id;
}

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new Error("O nome do perfil nao pode ficar vazio.");
  }
  if (normalized.length > MAX_NAME_LENGTH) {
    throw new Error(`O nome do perfil deve ter no maximo ${MAX_NAME_LENGTH} caracteres.`);
  }
  return normalized;
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const fallbackDisplayName = getFallbackDisplayName(user);
    const fallbackSeed = getFallbackAvatarSeed(user, fallbackDisplayName);
    const fallbackMode = user.image ? "upload" : "generated";
    const resolvedMode = profile?.avatarMode ?? fallbackMode;
    const storedUrl =
      profile?.avatarUrl ??
      (profile?.avatarStorageId ? await ctx.storage.getUrl(profile.avatarStorageId) : null) ??
      user.image ??
      null;

    return {
      userId,
      displayName: profile?.displayName ?? fallbackDisplayName,
      avatarMode: resolvedMode,
      avatarSeed: profile?.avatarSeed ?? fallbackSeed,
      avatarStorageId: profile?.avatarStorageId ?? null,
      avatarUrl: resolvedMode === "upload" ? storedUrl : null,
      authImageUrl: user.image ?? null,
      email: user.email ?? null,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Apenas usuarios logados podem enviar avatar.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateMyProfile = mutation({
  args: {
    displayName: v.string(),
    avatarMode: v.union(v.literal("generated"), v.literal("upload")),
    avatarSeed: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Apenas usuarios logados podem atualizar o perfil.");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Usuario nao encontrado.");
    }

    const displayName = normalizeDisplayName(args.displayName);
    const now = Date.now();
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let avatarSeed = existingProfile?.avatarSeed ?? getFallbackAvatarSeed(user, displayName);
    let avatarStorageId = existingProfile?.avatarStorageId;
    let avatarUrl = existingProfile?.avatarUrl;

    if (args.avatarMode === "generated") {
      avatarSeed = (args.avatarSeed?.trim() || avatarSeed).slice(0, 64);
      avatarStorageId = undefined;
      avatarUrl = undefined;
    } else {
      if (args.avatarStorageId) {
        const uploadedUrl = await ctx.storage.getUrl(args.avatarStorageId);
        if (!uploadedUrl) {
          throw new Error("Nao foi possivel salvar a imagem enviada.");
        }

        avatarStorageId = args.avatarStorageId;
        avatarUrl = uploadedUrl;
      } else if (!avatarStorageId && !avatarUrl && !user.image) {
        throw new Error("Envie uma imagem valida para usar como avatar.");
      }

      avatarUrl = avatarUrl ?? user.image ?? undefined;
    }

    const patch = {
      userId,
      displayName,
      avatarMode: args.avatarMode,
      avatarSeed,
      avatarStorageId,
      avatarUrl,
      updatedAt: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, patch);
    } else {
      await ctx.db.insert("userProfiles", patch);
    }

    return {
      displayName,
      avatarMode: args.avatarMode,
      avatarSeed,
      avatarUrl: args.avatarMode === "upload" ? avatarUrl ?? null : null,
    };
  },
});

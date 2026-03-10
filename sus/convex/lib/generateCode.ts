import type { QueryCtx } from "../_generated/server.js";

// Safe alphabet — no O, I, L, 0, 1
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return result;
}

/**
 * Generate a unique 4-character room code.
 * Retries up to 5 times if the code already exists in the DB.
 */
export async function generateUniqueCode(
  ctx: QueryCtx,
  length = 4
): Promise<string> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = randomCode(length);
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!existing) return code;
  }

  throw new Error(
    "Não foi possível gerar um código único. Tente novamente."
  );
}

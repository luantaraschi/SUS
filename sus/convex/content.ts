import { mutation } from "./_generated/server.js";
import type { MutationCtx, QueryCtx } from "./_generated/server.js";
import {
  DEFAULT_QUESTION_PACKS,
  DEFAULT_WORD_PACKS,
} from "./defaultContent.js";

type DefaultMode = "word" | "question";
type ContentCtx = MutationCtx | QueryCtx;

export function getFallbackDefaultPackKey(mode: DefaultMode) {
  return mode === "word" ? "classico" : "classico";
}

export function getDefaultWordPack(key?: string) {
  return (
    DEFAULT_WORD_PACKS.find((pack) => pack.key === key) ??
    DEFAULT_WORD_PACKS.find((pack) => pack.key === getFallbackDefaultPackKey("word"))!
  );
}

export function getDefaultQuestionPack(key?: string) {
  return (
    DEFAULT_QUESTION_PACKS.find((pack) => pack.key === key) ??
    DEFAULT_QUESTION_PACKS.find((pack) => pack.key === getFallbackDefaultPackKey("question"))!
  );
}

export function getDefaultPackCatalog(mode: DefaultMode) {
  return mode === "word" ? DEFAULT_WORD_PACKS : DEFAULT_QUESTION_PACKS;
}

export async function ensureDefaultContent(ctx: MutationCtx) {
  const existingWords = await ctx.db.query("wordPacks").collect();
  const existingWordKeys = new Set(existingWords.map((entry) => `${entry.category}|${entry.word}`));

  let insertedWords = 0;
  for (const pack of DEFAULT_WORD_PACKS) {
    for (const word of pack.items) {
      const dedupeKey = `${pack.title}|${word}`;
      if (existingWordKeys.has(dedupeKey)) {
        continue;
      }

      await ctx.db.insert("wordPacks", {
        category: pack.title,
        word,
        hint: pack.hint,
      });
      existingWordKeys.add(dedupeKey);
      insertedWords += 1;
    }
  }

  const existingQuestions = await ctx.db.query("questionPacks").collect();
  const existingQuestionKeys = new Set(
    existingQuestions.map((entry) => `${entry.category}|${entry.question}|${entry.impostorQuestion}`)
  );

  let insertedQuestions = 0;
  for (const pack of DEFAULT_QUESTION_PACKS) {
    for (const item of pack.items) {
      const dedupeKey = `${pack.title}|${item.question}|${item.impostorQuestion}`;
      if (existingQuestionKeys.has(dedupeKey)) {
        continue;
      }

      await ctx.db.insert("questionPacks", {
        category: pack.title,
        question: item.question,
        impostorQuestion: item.impostorQuestion,
      });
      existingQuestionKeys.add(dedupeKey);
      insertedQuestions += 1;
    }
  }

  return { insertedWords, insertedQuestions };
}

export async function getDefaultPackCount(
  ctx: ContentCtx,
  mode: DefaultMode,
  packKey?: string
) {
  void ctx;
  const pack =
    mode === "word" ? getDefaultWordPack(packKey) : getDefaultQuestionPack(packKey);

  return {
    pack,
    count: pack.items.length,
  };
}

export const ensureDefaultData = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await ensureDefaultContent(ctx);
    const wordCount = (await ctx.db.query("wordPacks").collect()).length;
    const questionCount = (await ctx.db.query("questionPacks").collect()).length;

    return {
      ...result,
      totalWords: wordCount,
      totalQuestions: questionCount,
    };
  },
});

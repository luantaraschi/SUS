import { mutation } from "./_generated/server.js";
import type { MutationCtx, QueryCtx } from "./_generated/server.js";
import {
  DEFAULT_QUESTION_PACKS,
  DEFAULT_WORD_PACKS,
} from "./defaultContent.js";
import { getWordPackCategoryAliases } from "./defaultWordPacks.js";

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
  let insertedWords = 0;
  let updatedWords = 0;
  let deletedWords = 0;

  for (const pack of DEFAULT_WORD_PACKS) {
    const categoryAliases = new Set(getWordPackCategoryAliases(pack));
    const rowsInScope = existingWords.filter((entry) => categoryAliases.has(entry.category));
    const expectedByWord = new Map(
      pack.items.map((item) => [item.word, item])
    );
    const syncedWords = new Set<string>();

    for (const row of rowsInScope) {
      const expectedItem = expectedByWord.get(row.word);
      if (!expectedItem || syncedWords.has(row.word)) {
        await ctx.db.delete(row._id);
        deletedWords += 1;
        continue;
      }

      syncedWords.add(row.word);

      const patch: { category?: string; hint?: string } = {};
      if (row.category !== pack.title) {
        patch.category = pack.title;
      }
      if (row.hint !== expectedItem.hint) {
        patch.hint = expectedItem.hint;
      }

      if (patch.category || patch.hint) {
        await ctx.db.patch(row._id, patch);
        updatedWords += 1;
      }
    }

    for (const item of pack.items) {
      if (syncedWords.has(item.word)) {
        continue;
      }

      await ctx.db.insert("wordPacks", {
        category: pack.title,
        word: item.word,
        hint: item.hint,
      });
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

  return { insertedWords, updatedWords, deletedWords, insertedQuestions };
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

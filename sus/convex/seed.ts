import { mutation } from "./_generated/server.js";
import { ensureDefaultContent } from "./content.js";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await ensureDefaultContent(ctx);
    const totalWords = (await ctx.db.query("wordPacks").collect()).length;
    const totalQuestions = (await ctx.db.query("questionPacks").collect()).length;

    return `Conteudo sincronizado: +${result.insertedWords} palavras, ${result.updatedWords} atualizadas, ${result.deletedWords} removidas, +${result.insertedQuestions} perguntas. Totais: ${totalWords} palavras e ${totalQuestions} perguntas.`;
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    hostId: v.string(),
    mode: v.union(v.literal("word"), v.literal("question")),
    questionMode: v.optional(
      v.union(v.literal("system"), v.literal("master"))
    ),
    status: v.union(
      v.literal("lobby"),
      v.literal("playing"),
      v.literal("finished")
    ),
    settings: v.object({
      maxPlayers: v.number(),
      rounds: v.number(),
      discussionTime: v.number(),
      votingTime: v.number(),
      impostorHint: v.boolean(),
      isLocalMode: v.boolean(),
    }),
    currentRound: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  players: defineTable({
    roomId: v.id("rooms"),
    sessionId: v.string(),
    name: v.string(),
    emoji: v.string(),
    isHost: v.boolean(),
    isBot: v.optional(v.boolean()),
    status: v.union(
      v.literal("connected"),
      v.literal("ready"),
      v.literal("disconnected")
    ),
    score: v.number(),
    joinedAt: v.number(),
    role: v.optional(
      v.union(v.literal("impostor"), v.literal("player"), v.literal("master"))
    ),
    secretContent: v.optional(v.union(v.string(), v.null())),
  })
    .index("by_room", ["roomId"])
    .index("by_session", ["sessionId"])
    .index("by_room_session", ["roomId", "sessionId"]),

  rounds: defineTable({
    roomId: v.id("rooms"),
    number: v.number(),
    mode: v.union(v.literal("word"), v.literal("question")),
    phase: v.optional(v.string()),
    status: v.union(
      v.literal("waiting"),
      v.literal("distributing"),
      v.literal("answering"),
      v.literal("revealing"),
      v.literal("voting"),
      v.literal("results")
    ),
    impostorId: v.id("players"),
    masterId: v.optional(v.union(v.id("players"), v.null())),

    // Word mode
    word: v.optional(v.union(v.string(), v.null())),
    hint: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),

    // Question mode
    questionMain: v.optional(v.union(v.string(), v.null())),
    questionImpostor: v.optional(v.union(v.string(), v.null())),

    phaseEndsAt: v.optional(v.number()),
    votedOutId: v.optional(v.id("players")),
    impostorWon: v.optional(v.boolean()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_number", ["roomId", "number"]),

  answers: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    text: v.string(),
    submittedAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),

  votes: defineTable({
    roundId: v.id("rounds"),
    voterId: v.id("players"),
    targetId: v.id("players"),
  })
    .index("by_round", ["roundId"])
    .index("by_round_voter", ["roundId", "voterId"]),

  wordPacks: defineTable({
    category: v.string(),
    word: v.string(),
    hint: v.string(),
  }).index("by_category", ["category"]),

  questionPacks: defineTable({
    category: v.string(),
    question: v.string(),
    impostorQuestion: v.string(),
  }).index("by_category", ["category"]),
});

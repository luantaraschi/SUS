import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

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
      customMasterId: v.optional(v.string()),
      defaultPackKey: v.optional(v.string()),
      customPackId: v.optional(v.id("customPacks")),
      numImpostors: v.optional(v.number()),
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
    avatarImageUrl: v.optional(v.string()),
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
    isSpectator: v.optional(v.boolean()),
  })
    .index("by_room", ["roomId"])
    .index("by_session", ["sessionId"])
    .index("by_room_session", ["roomId", "sessionId"]),

  rounds: defineTable({
    roomId: v.id("rooms"),
    number: v.number(),
    mode: v.union(v.literal("word"), v.literal("question")),
    status: v.union(
      v.literal("waiting"),
      v.literal("distributing"),
      v.literal("playing"),
      v.literal("speaking"),
      v.literal("answering"),
      v.literal("revealing"),
      v.literal("discussion"),
      v.literal("evidence"),
      v.literal("voting"),
      v.literal("results")
    ),
    word: v.optional(v.string()),
    hint: v.optional(v.string()),
    category: v.optional(v.union(v.string(), v.null())),
    questionMain: v.optional(v.string()),
    questionImpostor: v.optional(v.string()),
    impostorId: v.optional(v.id("players")),
    impostorIds: v.optional(v.array(v.id("players"))),
    masterId: v.optional(v.union(v.id("players"), v.null())),
    impostorWon: v.optional(v.boolean()),
    votedOutId: v.optional(v.union(v.id("players"), v.null())),
    startedAt: v.optional(v.number()),
    phaseEndsAt: v.optional(v.number()),
    revealedAt: v.optional(v.number()),
    resultReadyAt: v.optional(v.number()),
    speakingOrder: v.optional(v.array(v.id("players"))),
    currentSpeakerIndex: v.optional(v.number()),
    votingRequestedBy: v.optional(v.array(v.id("players"))),
    evidenceReadyBy: v.optional(v.array(v.id("players"))),
    nextRoundReadyBy: v.optional(v.array(v.id("players"))),
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

  gameHistory: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    roomCode: v.string(),
    mode: v.union(v.literal("word"), v.literal("question")),
    totalRounds: v.number(),
    wasImpostor: v.number(),
    timesDetected: v.number(),
    timesSurvived: v.number(),
    correctVotes: v.number(),
    finalScore: v.number(),
    finalRank: v.number(),
    totalPlayers: v.number(),
    playedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  customPacks: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    mode: v.union(v.literal("word"), v.literal("question")),
    items: v.array(
      v.object({
        content: v.string(), // word or question
        hint: v.string(),    // hint or impostorQuestion
      })
    ),
    createdAt: v.number(),
  }).index("by_author", ["authorId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    avatarMode: v.union(v.literal("generated"), v.literal("upload")),
    avatarSeed: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    colorScheme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    backgroundThemeId: v.string(),
    backgroundAnimationEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  bugReports: defineTable({
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    route: v.string(),
    browserInfo: v.string(),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
});

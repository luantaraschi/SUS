import { v } from "convex/values";
import { query } from "./_generated/server.js";

const BACKEND_VERSION = "2026.03.16-recovery.1";
const SCHEMA_VERSION = 2;
const MIN_FRONTEND_VERSION = "2026.03.16-recovery.1";

export const getCompatibility = query({
  args: {
    frontendVersion: v.optional(v.string()),
    schemaVersion: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const compatible = (args.schemaVersion ?? SCHEMA_VERSION) === SCHEMA_VERSION;

    return {
      backendVersion: BACKEND_VERSION,
      schemaVersion: SCHEMA_VERSION,
      minFrontendVersion: MIN_FRONTEND_VERSION,
      frontendVersion: args.frontendVersion ?? null,
      compatible,
      reason: compatible ? null : "schema_version_mismatch",
    };
  },
});

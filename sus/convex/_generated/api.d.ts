/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as answers from "../answers.js";
import type * as auth from "../auth.js";
import type * as debug from "../debug.js";
import type * as history from "../history.js";
import type * as http from "../http.js";
import type * as lib_generateCode from "../lib/generateCode.js";
import type * as packs from "../packs.js";
import type * as players from "../players.js";
import type * as profiles from "../profiles.js";
import type * as rooms from "../rooms.js";
import type * as rounds from "../rounds.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  answers: typeof answers;
  auth: typeof auth;
  debug: typeof debug;
  history: typeof history;
  http: typeof http;
  "lib/generateCode": typeof lib_generateCode;
  packs: typeof packs;
  players: typeof players;
  profiles: typeof profiles;
  rooms: typeof rooms;
  rounds: typeof rounds;
  seed: typeof seed;
  users: typeof users;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

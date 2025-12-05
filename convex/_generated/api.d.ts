/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as albumMembers from "../albumMembers.js";
import type * as albums from "../albums.js";
import type * as cloudflare from "../cloudflare.js";
import type * as comment from "../comment.js";
import type * as crypto from "../crypto.js";
import type * as friendships from "../friendships.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as media from "../media.js";
import type * as profile from "../profile.js";
import type * as r2 from "../r2.js";
import type * as shareCodes from "../shareCodes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  albumMembers: typeof albumMembers;
  albums: typeof albums;
  cloudflare: typeof cloudflare;
  comment: typeof comment;
  crypto: typeof crypto;
  friendships: typeof friendships;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  media: typeof media;
  profile: typeof profile;
  r2: typeof r2;
  shareCodes: typeof shareCodes;
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

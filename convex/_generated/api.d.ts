/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as albumMembers from "../albumMembers.js";
import type * as albums from "../albums.js";
import type * as cloudflare from "../cloudflare.js";
import type * as comment from "../comment.js";
import type * as crypto from "../crypto.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as media from "../media.js";
import type * as profile from "../profile.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  albumMembers: typeof albumMembers;
  albums: typeof albums;
  cloudflare: typeof cloudflare;
  comment: typeof comment;
  crypto: typeof crypto;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  media: typeof media;
  profile: typeof profile;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

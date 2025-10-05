/**
 * Type Definitions for Deal Creation
 *
 * Defines types and interfaces for creating deals in the system.
 * Includes DynamoDB entity structure, API payload, and result types.
 *
 * @module lib/api/endpoints/deals/post/types
 */

/**
 * Deal category enumeration
 *
 * Supported deal categories for classification and filtering.
 */
export type TDealCategory =
  | "foodDrink"
  | "bathroom"
  | "jewelery"
  | "sports"
  | "tech"
  | "auto"
  | "entertainment"
  | "travel";

/**
 * DynamoDB Deal Entity
 *
 * Represents a deal as stored in DynamoDB using single-table design.
 *
 * @property PK - Partition key: `DEAL#{dealId}`
 * @property SK - Sort key: `DEAL#{dealId}`
 * @property EntityType - Always "Deal" for type discrimination
 * @property Id - Unique deal identifier (KSUID)
 * @property Title - Deal title/name
 * @property OriginalPrice - Original price before discount
 * @property Discount - Discount percentage (0-100)
 * @property Category - Deal category for filtering
 * @property Expiration - Deal expiration date (ISO 8601)
 * @property MerchantId - User ID of merchant who created the deal
 * @property LogoFileKey - S3 key for deal logo image
 * @property CreatedAt - Creation timestamp (ISO 8601)
 */
export interface IDealEntity {
  PK: string;
  SK: string;
  EntityType: "Deal";
  Id: string; // dealId
  Title: string;
  OriginalPrice: number;
  Discount: number; // percentage 0-100
  Category: TDealCategory;
  Expiration: string; // ISO 8601
  MerchantId: string; // userId of merchant
  LogoFileKey: string;
  CreatedAt: string; // ISO 8601
}

/**
 * Deal creation payload
 *
 * Data structure for creating a new deal via API.
 * Validated against Zod schema before processing.
 *
 * @property userId - Merchant's user ID (from auth token)
 * @property title - Deal title (1-200 characters)
 * @property originalPrice - Original price (coerced to number by Zod)
 * @property discount - Discount percentage 0-100 (coerced to number by Zod)
 * @property category - Deal category
 * @property expiration - Expiration date (ISO 8601, must be 7+ days from now)
 * @property logoFileKey - S3 key for logo image
 * @property dealId - Optional deal ID (generated server-side if not provided)
 */
export type TCreateDealPayload = {
  userId: string;
  title: string;
  originalPrice: number | string;
  discount: number | string;
  category: TDealCategory;
  expiration: string; // ISO
  logoFileKey: string;
  dealId?: string;
};

/**
 * Result type for error handling
 *
 * Type-safe result pattern that forces explicit error handling.
 * Replaces throwing exceptions with discriminated union.
 *
 * @template T - Type of successful result data
 *
 * @example
 * // Success case
 * const result: TResult<string> = { ok: true, data: "success" };
 * if (result.ok) {
 *   console.log(result.data); // TypeScript knows data exists
 * }
 *
 * @example
 * // Error case
 * const result: TResult<string> = {
 *   ok: false,
 *   response: apiError(400, "Bad request")
 * };
 * if (!result.ok) {
 *   return result.response; // Return error response
 * }
 *
 * @remarks
 * Benefits:
 * - Type-safe error handling
 * - Compiler-enforced error checking
 * - No uncaught exceptions
 * - Clear success/failure paths
 */
export type TResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: import("#src/helpers/api").TApiResponse };

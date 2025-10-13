/**
 * Type Definitions for primary resource creation
 *
 * Defines types and interfaces for creating the primary resource in the system.
 * Includes DynamoDB entity structure, API payload, and result types.
 *
 * @module lib/api/endpoints/resource/post/types
 */

/**
 * Category enumeration
 *
 * Supported resource categories for classification and filtering.
 */
export type TResourceCategory =
  | "foodDrink"
  | "bathroom"
  | "jewelery"
  | "sports"
  | "tech"
  | "auto"
  | "entertainment"
  | "travel";

/**
 * DynamoDB resource entity
 *
 * Represents the resource as stored in DynamoDB using single-table design.
 *
 * @property PK - Partition key: `RESOURCE#{resourceId}`
 * @property SK - Sort key: `RESOURCE#{resourceId}`
 * @property EntityType - Always "Resource" for type discrimination
 * @property Id - Unique resource identifier (KSUID)
 * @property Title - Resource title/name
 * @property OriginalPrice - Original price before discount
 * @property Discount - Discount percentage (0-100)
 * @property Category - Resource category for filtering
 * @property Expiration - Resource expiration date (ISO 8601)
 * @property MerchantId - User ID associated with the resource
 * @property LogoFileKey - S3 key for resource media
 * @property CreatedAt - Creation timestamp (ISO 8601)
 */
export interface IResourceEntity {
  PK: string;
  SK: string;
  EntityType: "Resource";
  Id: string; // resourceId
  Title: string;
  OriginalPrice: number;
  Discount: number; // percentage 0-100
  Category: TResourceCategory;
  Expiration: string; // ISO 8601
  MerchantId: string; // userId of merchant
  LogoFileKey: string;
  CreatedAt: string; // ISO 8601
}

/**
 * Resource creation payload
 *
 * Data structure for creating a new resource via API.
 * Validated against Zod schema before processing.
 *
 * @property userId - Merchant's user ID (from auth token)
 * @property title - Resource title (1-200 characters)
 * @property originalPrice - Original price (coerced to number by Zod)
 * @property discount - Discount percentage 0-100 (coerced to number by Zod)
 * @property category - Resource category
 * @property expiration - Expiration date (ISO 8601, must be 7+ days from now)
 * @property logoFileKey - S3 key for associated image
 * @property resourceId - Optional resource ID (generated server-side if not provided)
 */
export type TCreateResourcePayload = {
  userId: string;
  title: string;
  originalPrice: number | string;
  discount: number | string;
  category: TResourceCategory;
  expiration: string; // ISO
  logoFileKey: string;
  resourceId?: string;
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

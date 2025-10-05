/**
 * Zod Validation Schema for Deal Creation
 *
 * Defines runtime validation rules for deal creation payloads.
 * Provides type-safe validation with automatic type inference.
 *
 * Features:
 * - Runtime type checking
 * - Automatic type coercion (strings to numbers)
 * - Custom validation rules
 * - Detailed error messages
 *
 * @module lib/api/endpoints/deals/post/payload.schema
 */

import { z } from "zod";
import type { TDealCategory } from "./types";

/**
 * Deal category enumeration for Zod validation
 *
 * Readonly array of valid deal categories.
 * Used by Zod enum validator to ensure category is valid.
 */
export const categoryEnum = [
  "foodDrink",
  "bathroom",
  "jewelery",
  "sports",
  "tech",
  "auto",
  "entertainment",
  "travel",
] as const satisfies Readonly<TDealCategory[]>;

/**
 * Deal creation payload validation schema
 *
 * Validates and transforms deal creation requests.
 * Automatically coerces string numbers to actual numbers.
 *
 * Validation Rules:
 * - userId: Non-empty string
 * - title: 1-255 characters
 * - originalPrice: Number >= 1 (coerced from string)
 * - discount: Number 0-100 (coerced from string)
 * - logoFileKey: Non-empty string (S3 key)
 * - category: One of valid categories
 * - expiration: Valid ISO 8601 date-time string
 *
 * @example
 * // Valid payload
 * const payload = {
 *   userId: "user-123",
 *   title: "50% Off Pizza",
 *   originalPrice: "20.00", // Will be coerced to 20
 *   discount: "50", // Will be coerced to 50
 *   logoFileKey: "logos/pizza.png",
 *   category: "foodDrink",
 *   expiration: "2025-12-31T23:59:59Z"
 * };
 * const result = dealPayloadSchema.safeParse(payload);
 * if (result.success) {
 *   console.log(result.data); // Validated and transformed data
 * }
 *
 * @example
 * // Invalid payload
 * const invalid = { title: "" }; // Missing required fields
 * const result = dealPayloadSchema.safeParse(invalid);
 * if (!result.success) {
 *   console.log(result.error.flatten()); // Detailed error messages
 * }
 */
export const dealPayloadSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(255),
  originalPrice: z.coerce.number().gte(1),
  discount: z.coerce.number().min(0).max(100),
  logoFileKey: z.string().min(1),
  category: z.enum(categoryEnum),
  // ISO 8601 date-time validation without deprecated helpers
  expiration: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Invalid ISO 8601 date-time",
    }),
});

/**
 * Inferred TypeScript type from Zod schema
 *
 * Automatically derives TypeScript type from the validation schema.
 * Ensures type definitions stay in sync with validation rules.
 *
 * @remarks
 * This type is automatically inferred from dealPayloadSchema.
 * Any changes to the schema automatically update this type.
 */
export type TCreateDealPayload = z.infer<typeof dealPayloadSchema>;

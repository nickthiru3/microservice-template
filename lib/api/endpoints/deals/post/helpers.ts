/**
 * Deal Creation Helper Functions
 *
 * Business logic layer for creating deals. Follows stratified design:
 * - Layer 1: Handler (orchestration) - handler.ts
 * - Layer 2: Business logic (this file) - helpers.ts
 * - Layer 3: Infrastructure (AWS SDK) - DynamoDB client
 *
 * Functions are organized by responsibility:
 * - Parsing and validation
 * - Data normalization and validation
 * - ID generation
 * - Item building
 * - Database operations
 * - Response formatting
 * - Error handling
 * - Environment configuration
 *
 * @module lib/api/endpoints/deals/post/helpers
 */

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import KSUID from "ksuid";
import type { APIGatewayProxyEvent } from "aws-lambda";
import {
  apiSuccess,
  apiError,
  serializeErr,
  type TApiResponse,
} from "#src/helpers/api";
import { dealPayloadSchema } from "./payload.schema";
import type { TResult, TCreateDealPayload, IDealEntity } from "./types";

const ddbClient = new DynamoDBClient();

/**
 * Parses and validates request body
 *
 * Extracts JSON body from API Gateway event and validates against Zod schema.
 * Returns Result type for type-safe error handling.
 *
 * @param event - API Gateway proxy event
 * @returns Result with validated payload or error response
 *
 * @example
 * const result = parseAndValidateBody(event);
 * if (!result.ok) {
 *   return result.response; // 400 error
 * }
 * const payload = result.data; // Type-safe validated data
 *
 * @remarks
 * Error cases:
 * - Missing body: 400 "Invalid request body: body is required"
 * - Invalid JSON: 400 "Invalid JSON in request body"
 * - Schema validation failure: 400 with Zod error details
 */
export function parseAndValidateBody(
  event: APIGatewayProxyEvent
): TResult<TCreateDealPayload> {
  if (!event.body) {
    return {
      ok: false,
      response: apiError(400, "Invalid request body: body is required"),
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body);
  } catch (e) {
    return {
      ok: false,
      response: apiError(400, "Invalid JSON in request body"),
    };
  }
  const result = dealPayloadSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      response: apiError(400, "Invalid request body", result.error.flatten()),
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Generates unique deal identifier
 *
 * Uses KSUID (K-Sortable Unique Identifier) for time-ordered unique IDs.
 * KSUIDs are sortable by creation time and globally unique.
 *
 * @returns KSUID string (e.g., "2D9RGmKVg3KKf7mJJQhWWqH9Gfm")
 *
 * @example
 * const dealId = generateDealId();
 * // Returns: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm"
 *
 * @remarks
 * KSUID benefits:
 * - Time-ordered (sortable by creation time)
 * - Globally unique (no collisions)
 * - URL-safe (no special characters)
 * - 27 characters long
 */
export function generateDealId(): string {
  return KSUID.randomSync(new Date()).string;
}

/**
 * Prepares successful API response
 *
 * Creates standardized success response with deal ID.
 * Logs response for debugging.
 *
 * @param dealId - Created deal identifier
 * @returns API Gateway success response (200)
 *
 * @example
 * const response = prepareSuccessResponse("2D9RGmKVg3KKf7mJJQhWWqH9Gfm");
 * // Returns: {
 * //   statusCode: 200,
 * //   headers: { ... CORS headers ... },
 * //   body: JSON.stringify({
 * //     message: "Deal successfully created",
 * //     dealId: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm"
 * //   })
 * // }
 */
export function prepareSuccessResponse(dealId: string): TApiResponse {
  const successResponse = apiSuccess({
    message: "Deal successfully created",
    dealId,
  });
  console.log(`Success Response: ${JSON.stringify(successResponse, null, 2)}`);
  return successResponse;
}

/**
 * Logs incoming API Gateway event
 *
 * Logs full event for debugging and audit trail.
 *
 * @param event - API Gateway proxy event
 *
 * @example
 * logEventReceived(event);
 * // Logs: "Received event: { ... full event object ... }"
 */
export function logEventReceived(event: APIGatewayProxyEvent) {
  console.log("Received event:", JSON.stringify(event, null, 2));
}

/**
 * Prepares error API response
 *
 * Converts exceptions to standardized error responses.
 * Extracts status code, message, and details from error object.
 *
 * @param err - Error object (any type)
 * @returns API Gateway error response
 *
 * @example
 * try {
 *   throw new Error("Something went wrong");
 * } catch (err) {
 *   return prepareErrorResponse(err);
 *   // Returns: 500 error with message and serialized error details
 * }
 *
 * @example
 * // Custom error with status code
 * const customError = {
 *   statusCode: 400,
 *   message: "Invalid data",
 *   details: { field: "title" }
 * };
 * return prepareErrorResponse(customError);
 * // Returns: 400 error with custom message and details
 *
 * @remarks
 * Error handling:
 * - Extracts statusCode if present (defaults to 500)
 * - Extracts message if present (defaults to "Failed to create deal")
 * - Serializes error details safely (no stack traces)
 */
export function prepareErrorResponse(err: unknown): TApiResponse {
  const anyErr = err as any;
  const status = typeof anyErr?.statusCode === "number" ? anyErr.statusCode : 500;
  const message = anyErr?.message || "Failed to create deal";
  const details = anyErr?.details ?? serializeErr(err);
  return apiError(status, message, details);
}

/**
 * Retrieves required environment variables
 *
 * Validates that all required environment variables are set.
 * Returns Result type for type-safe error handling.
 *
 * @returns Result with environment variables or error response
 *
 * @example
 * const envResult = getRequiredEnv();
 * if (!envResult.ok) {
 *   return envResult.response; // 500 error
 * }
 * const { tableName } = envResult.data; // Type-safe access
 *
 * @remarks
 * Required environment variables:
 * - TABLE_NAME: DynamoDB table name (set by CDK)
 *
 * Returns 500 error if any required variable is missing.
 */
export function getRequiredEnv(): TResult<{ tableName: string }> {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    return { ok: false, response: apiError(500, "TABLE_NAME env var not set") };
  }
  return { ok: true, data: { tableName } };
}

/**
 * Normalizes deal payload data
 *
 * Cleans and standardizes input data before validation.
 * Trims whitespace from string fields.
 *
 * @param data - Validated deal payload
 * @returns Normalized deal payload
 *
 * @example
 * const data = {
 *   title: "  50% Off Pizza  ",
 *   logoFileKey: "  logos/pizza.png  ",
 *   // ... other fields
 * };
 * const normalized = normalizeData(data);
 * // Returns: {
 * //   title: "50% Off Pizza",
 * //   logoFileKey: "logos/pizza.png",
 * //   // ... other fields unchanged
 * // }
 *
 * @remarks
 * Normalization:
 * - Trims title
 * - Trims logoFileKey
 * - originalPrice/discount already coerced to numbers by Zod
 */
export function normalizeData(data: TCreateDealPayload): TCreateDealPayload {
  return {
    ...data,
    title: data.title.trim(),
    logoFileKey: data.logoFileKey.trim(),
    // originalPrice/discount already coerced to numbers by zod transform
  };
}

/**
 * Validates business rules for deal data
 *
 * Performs business logic validation beyond schema validation.
 * Throws errors for invalid data (caught by handler).
 *
 * @param data - Normalized deal payload
 * @throws {Error} If expiration is less than 7 days from today
 *
 * @example
 * const data = {
 *   expiration: "2025-10-10T00:00:00Z", // Tomorrow
 *   // ... other fields
 * };
 * validateData(data);
 * // Throws: "expiration must be at least 7 days from today"
 *
 * @example
 * const data = {
 *   expiration: "2025-12-31T00:00:00Z", // Far future
 *   // ... other fields
 * };
 * validateData(data); // No error
 *
 * @remarks
 * Business rules:
 * - Expiration must be at least 7 days from today (midnight)
 * - Ensures deals have reasonable lifetime
 * - Prevents accidental short-lived deals
 */
export function validateData(data: TCreateDealPayload): void {
  const expiresAt = Date.parse(data.expiration);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);
  if (new Date(expiresAt) < minDate) {
    throw new Error("expiration must be at least 7 days from today");
  }
}

/**
 * Builds DynamoDB deal entity
 *
 * Transforms API payload into DynamoDB item structure.
 * Adds partition/sort keys and metadata.
 *
 * @param data - Normalized and validated deal payload
 * @param dealId - Generated deal identifier
 * @returns DynamoDB deal entity
 *
 * @example
 * const data = {
 *   userId: "user-123",
 *   title: "50% Off Pizza",
 *   originalPrice: 20,
 *   discount: 50,
 *   category: "foodDrink",
 *   expiration: "2025-12-31T23:59:59Z",
 *   logoFileKey: "logos/pizza.png"
 * };
 * const dealId = "2D9RGmKVg3KKf7mJJQhWWqH9Gfm";
 * const item = buildDealItem(data, dealId);
 * // Returns: {
 * //   PK: "DEAL#2D9RGmKVg3KKf7mJJQhWWqH9Gfm",
 * //   SK: "DEAL#2D9RGmKVg3KKf7mJJQhWWqH9Gfm",
 * //   EntityType: "Deal",
 * //   Id: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm",
 * //   Title: "50% Off Pizza",
 * //   OriginalPrice: 20,
 * //   Discount: 50,
 * //   Category: "foodDrink",
 * //   Expiration: "2025-12-31T23:59:59Z",
 * //   MerchantId: "user-123",
 * //   LogoFileKey: "logos/pizza.png",
 * //   CreatedAt: "2025-10-03T08:00:00.000Z"
 * // }
 *
 * @remarks
 * DynamoDB structure:
 * - PK: DEAL#{dealId} (partition key)
 * - SK: DEAL#{dealId} (sort key)
 * - EntityType: "Deal" (for type discrimination)
 * - CreatedAt: Current timestamp (ISO 8601)
 */
export function buildDealItem(
  data: TCreateDealPayload,
  dealId: string
): IDealEntity {
  return {
    PK: `DEAL#${dealId}`,
    SK: `DEAL#${dealId}`,
    EntityType: "Deal",
    Id: dealId,
    Title: data.title,
    OriginalPrice: Number(data.originalPrice),
    Discount: Number(data.discount),
    Category: data.category,
    Expiration: data.expiration,
    MerchantId: data.userId,
    LogoFileKey: data.logoFileKey,
    CreatedAt: new Date().toISOString(),
  };
}

/**
 * Saves deal to DynamoDB
 *
 * Writes deal entity to DynamoDB with conditional write to prevent duplicates.
 * Returns Result type for type-safe error handling.
 *
 * @param tableName - DynamoDB table name
 * @param dealItem - Deal entity to save
 * @returns Result with success boolean or error response
 *
 * @example
 * const result = await saveDealToDynamoDB("deals-table", dealItem);
 * if (!result.ok) {
 *   return result.response; // Error response
 * }
 * // Deal saved successfully
 *
 * @remarks
 * Conditional write:
 * - Uses ConditionExpression to prevent overwrites
 * - Fails if PK and SK already exist
 * - Returns 409 Conflict if deal already exists
 *
 * Error handling:
 * - ConditionalCheckFailedException: 409 "Deal already exists"
 * - Other errors: 502 "Error saving deal" with error details
 */
export async function saveDealToDynamoDB(
  tableName: string,
  dealItem: IDealEntity
): Promise<TResult<true>> {
  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(dealItem),
        ConditionExpression:
          "attribute_not_exists(#PK) AND attribute_not_exists(#SK)",
        ExpressionAttributeNames: { "#PK": "PK", "#SK": "SK" },
      })
    );
    return { ok: true, data: true };
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return { ok: false, response: apiError(409, "Deal already exists") };
    }
    return {
      ok: false,
      response: apiError(502, "Error saving deal", { message: err?.message }),
    };
  }
}

/**
 * Primary resource creation helper functions
 *
 * Business logic layer for creating resources. Follows stratified design:
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
 * @module lib/api/endpoints/resource/post/helpers
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
import { resourcePayloadSchema } from "./payload.schema";
import type {
  TResult,
  TCreateResourcePayload,
  IResourceEntity,
} from "./types";

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
): TResult<TCreateResourcePayload> {
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
  const result = resourcePayloadSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      response: apiError(400, "Invalid request body", result.error.flatten()),
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Generates unique resource identifier
 *
 * Uses KSUID (K-Sortable Unique Identifier) for time-ordered unique IDs.
 * KSUIDs are sortable by creation time and globally unique.
 *
 * @returns KSUID string (e.g., "2D9RGmKVg3KKf7mJJQhWWqH9Gfm")
 *
 * @example
 * const resourceId = generateResourceId();
 * // Returns: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm"
 *
 * @remarks
 * KSUID benefits:
 * - Time-ordered (sortable by creation time)
 * - Globally unique (no collisions)
 * - URL-safe (no special characters)
 * - 27 characters long
 */
export function generateResourceId(): string {
  return KSUID.randomSync(new Date()).string;
}

/**
 * Prepares successful API response
 *
 * Creates standardized success response with resource ID.
 * Logs response for debugging.
 *
 * @param resourceId - Created resource identifier
 * @returns API Gateway success response (200)
 *
 * @example
 * const response = prepareSuccessResponse("2D9RGmKVg3KKf7mJJQhWWqH9Gfm");
 * // Returns: {
 * //   statusCode: 200,
 * //   headers: { ... CORS headers ... },
 * //   body: JSON.stringify({
 * //     message: "Resource successfully created",
 * //     resourceId: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm"
 * //   })
 * // }
 */
export function prepareSuccessResponse(resourceId: string): TApiResponse {
  const successResponse = apiSuccess({
    message: "Resource successfully created",
    resourceId,
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
 * - Extracts message if present (defaults to "Failed to create resource")
 * - Serializes error details safely (no stack traces)
 */
export function prepareErrorResponse(err: unknown): TApiResponse {
  const anyErr = err as any;
  const status = typeof anyErr?.statusCode === "number" ? anyErr.statusCode : 500;
  const message = anyErr?.message || "Failed to create resource";
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
 * Normalizes resource payload data
 *
 * Cleans and standardizes input data before validation.
 * Trims whitespace from string fields.
 *
 * @param data - Validated resource payload
 * @returns Normalized resource payload
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
export function normalizeData(
  data: TCreateResourcePayload
): TCreateResourcePayload {
  return {
    ...data,
    title: data.title.trim(),
    logoFileKey: data.logoFileKey.trim(),
    // originalPrice/discount already coerced to numbers by zod transform
  };
}

/**
 * Validates business rules for resource data
 *
 * Performs business logic validation beyond schema validation.
 * Throws errors for invalid data (caught by handler).
 *
 * @param data - Normalized resource payload
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
 * - Ensures resources have reasonable lifetime
 * - Prevents accidental short-lived resources
 */
export function validateData(data: TCreateResourcePayload): void {
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
 * Builds DynamoDB resource entity
 *
 * Transforms API payload into DynamoDB item structure.
 * Adds partition/sort keys and metadata.
 *
 * @param data - Normalized and validated resource payload
 * @param resourceId - Generated resource identifier
 * @returns DynamoDB resource entity
 *
 * @example
 * const data = {
 *   userId: "user-123",
 *   title: "Sample Title",
 *   originalPrice: 20,
 *   discount: 50,
 *   category: "foodDrink",
 *   expiration: "2025-12-31T23:59:59Z",
 *   logoFileKey: "media/sample.png"
 * };
 * const resourceId = "2D9RGmKVg3KKf7mJJQhWWqH9Gfm";
 * const item = buildResourceItem(data, resourceId);
 * // Returns: {
 * //   PK: "RESOURCE#2D9RGmKVg3KKf7mJJQhWWqH9Gfm",
 * //   SK: "RESOURCE#2D9RGmKVg3KKf7mJJQhWWqH9Gfm",
 * //   EntityType: "Resource",
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
 * - PK: RESOURCE#{resourceId} (partition key)
 * - SK: RESOURCE#{resourceId} (sort key)
 * - EntityType: "Resource" (for type discrimination)
 * - CreatedAt: Current timestamp (ISO 8601)
 */
export function buildResourceItem(
  data: TCreateResourcePayload,
  resourceId: string
): IResourceEntity {
  return {
    PK: `RESOURCE#${resourceId}`,
    SK: `RESOURCE#${resourceId}`,
    EntityType: "Resource",
    Id: resourceId,
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
 * Saves resource to DynamoDB
 *
 * Writes resource entity to DynamoDB with conditional write to prevent duplicates.
 * Returns Result type for type-safe error handling.
 *
 * @param tableName - DynamoDB table name
 * @param resourceItem - Resource entity to save
 * @returns Result with success boolean or error response
 *
 * @example
 * const result = await saveResourceToDynamoDB("resource-table", resourceItem);
 * if (!result.ok) {
 *   return result.response; // Error response
 * }
 * // Resource saved successfully
 *
 * @remarks
 * Conditional write:
 * - Uses ConditionExpression to prevent overwrites
 * - Fails if PK and SK already exist
 * - Returns 409 Conflict if the resource already exists
 *
 * Error handling:
 * - ConditionalCheckFailedException: 409 "Resource already exists"
 * - Other errors: 502 "Error saving resource" with error details
 */
export async function saveResourceToDynamoDB(
  tableName: string,
  resourceItem: IResourceEntity
): Promise<TResult<true>> {
  try {
    await ddbClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(resourceItem),
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );
    return { ok: true, data: true };
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return { ok: false, response: apiError(409, "Resource already exists") };
    }
    return {
      ok: false,
      response: apiError(502, "Error saving resource", { message: err?.message }),
    };
  }
}

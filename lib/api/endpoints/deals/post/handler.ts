/**
 * POST /deals Handler
 *
 * Lambda handler for creating new deals. Follows stratified design:
 * - This file: Pure orchestration (Layer 1)
 * - helpers.ts: Business logic (Layer 2)
 * - AWS SDK: Infrastructure (Layer 3)
 *
 * Flow:
 * 1. Parse and validate request body (Zod schema)
 * 2. Get required environment variables
 * 3. Normalize data (trim whitespace)
 * 4. Validate business rules (expiration >= 7 days)
 * 5. Generate unique deal ID (KSUID)
 * 6. Build DynamoDB item
 * 7. Save to DynamoDB (conditional write)
 * 8. Return success response
 *
 * Error Handling:
 * - Parse errors: 400 Bad Request
 * - Validation errors: 400 Bad Request
 * - Environment errors: 500 Internal Server Error
 * - DynamoDB conflicts: 409 Conflict
 * - DynamoDB errors: 502 Bad Gateway
 * - Generic errors: 500 Internal Server Error
 *
 * @module lib/api/endpoints/deals/post/handler
 */

import type { APIGatewayProxyEvent } from "aws-lambda";
import { type TApiResponse } from "#src/helpers/api";
import type { TResult, TCreateDealPayload } from "./types";
import {
  parseAndValidateBody,
  getRequiredEnv,
  normalizeData,
  validateData,
  generateDealId,
  buildDealItem,
  saveDealToDynamoDB,
  prepareSuccessResponse,
  prepareErrorResponse,
  logEventReceived,
} from "./helpers";

/**
 * Lambda handler for creating deals
 *
 * Pure orchestration function that delegates to helper functions.
 * No business logic - only coordinates the flow.
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy response
 *
 * @example
 * // Successful request
 * const event = {
 *   body: JSON.stringify({
 *     userId: "user-123",
 *     title: "50% Off Pizza",
 *     originalPrice: "20.00",
 *     discount: "50",
 *     category: "foodDrink",
 *     expiration: "2025-12-31T23:59:59Z",
 *     logoFileKey: "logos/pizza.png"
 *   })
 * };
 * const response = await handler(event);
 * // Returns: {
 * //   statusCode: 200,
 * //   body: JSON.stringify({
 * //     message: "Deal successfully created",
 * //     dealId: "2D9RGmKVg3KKf7mJJQhWWqH9Gfm"
 * //   })
 * // }
 *
 * @example
 * // Invalid request
 * const event = { body: JSON.stringify({ title: "" }) };
 * const response = await handler(event);
 * // Returns: 400 error with validation details
 *
 * @remarks
 * Handler responsibilities:
 * - Orchestrate helper function calls
 * - Handle Result types (ok/not ok)
 * - Catch and format exceptions
 * - No business logic
 *
 * Helper functions handle:
 * - Parsing and validation
 * - Business logic
 * - Database operations
 * - Response formatting
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<TApiResponse> => {
  logEventReceived(event);

  // Parse + validate body (zod)
  const bodyResult = parseAndValidateBody(event);
  if (!bodyResult.ok) return bodyResult.response;
  const data: TCreateDealPayload = bodyResult.data;

  // Env asserts
  const envResult = getRequiredEnv();
  if (!envResult.ok) return envResult.response;
  const { tableName } = envResult.data;

  try {
    // Normalize + dynamic validation (throws on invalid)
    const normalizedData = normalizeData(data);
    validateData(normalizedData);

    // Generate server-side dealId
    const dealId = generateDealId();

    // Build item and save with conditional write
    const dealItem = buildDealItem(normalizedData, dealId);
    const saveResult = await saveDealToDynamoDB(tableName, dealItem);
    if (!saveResult.ok) return saveResult.response;

    const successResponse = prepareSuccessResponse(dealId);
    return successResponse;
  } catch (err) {
    return prepareErrorResponse(err);
  }
};

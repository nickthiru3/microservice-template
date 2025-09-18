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

// ----------------------------
// Helpers (kept after handler)
// ----------------------------

function parseAndValidateBody(
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

// Generates a unique deal ID
function generateDealId(): string {
  return KSUID.randomSync(new Date()).string;
}

// Creates a standardized success API response
function prepareSuccessResponse(dealId: string): TApiResponse {
  const successResponse = apiSuccess({
    message: "Deal successfully created",
    dealId,
  });
  console.log(`Success Response: ${JSON.stringify(successResponse, null, 2)}`);
  return successResponse;
}

// Logs the received event (truncated for readability in CloudWatch)
function logEventReceived(event: APIGatewayProxyEvent) {
  console.log("Received event:", JSON.stringify(event, null, 2));
}

// Creates a standardized error API response
function prepareErrorResponse(err: unknown): TApiResponse {
  const anyErr = err as any;
  const status =
    typeof anyErr?.statusCode === "number" ? anyErr.statusCode : 500;
  const message = anyErr?.message || "Failed to create deal";
  const details = anyErr?.details ?? serializeErr(err);
  return apiError(status, message, details);
}

function getRequiredEnv(): TResult<{ tableName: string }> {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    return { ok: false, response: apiError(500, "TABLE_NAME env var not set") };
  }
  return { ok: true, data: { tableName } };
}

function normalizeData(data: TCreateDealPayload): TCreateDealPayload {
  return {
    ...data,
    title: data.title.trim(),
    logoFileKey: data.logoFileKey.trim(),
    // originalPrice/discount already coerced to numbers by zod transform
  };
}

function validateData(data: TCreateDealPayload): void {
  // Additional dynamic rule: expiration at least 7 days from today
  const expiresAt = Date.parse(data.expiration);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);
  if (new Date(expiresAt) < minDate) {
    throw new Error("expiration must be at least 7 days from today");
  }
}

function buildDealItem(data: TCreateDealPayload, dealId: string): IDealEntity {
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

async function saveDealToDynamoDB(
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

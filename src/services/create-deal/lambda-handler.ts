import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import KSUID from "ksuid";

// API helpers (pure functions)
import { success, error, ApiResponse } from "#src/helpers/api";

// Initialize AWS clients
const ddbClient = new DynamoDBClient();

export interface DealEntity {
  PK: string;
  SK: string;
  EntityType: "Deal";
  Id: string; // dealId
  Title: string;
  OriginalPrice: number;
  Discount: number; // percentage 0-100
  Category: string; // consider narrowing via union
  Expiration: string; // ISO 8601
  MerchantId: string; // userId of merchant
  LogoFileKey: string;
  CreatedAt: string; // ISO 8601
}

type Category =
  | "foodDrink"
  | "bathroom"
  | "jewelery"
  | "sports"
  | "tech"
  | "auto"
  | "entertainment"
  | "travel";

export type CreateDealFormInput = {
  userId: string;
  title: string;
  originalPrice: number | string;
  discount: number | string;
  category: Category;
  expiration: string; // ISO
  logoFileKey: string;
  dealId?: string;
};

// Allowed categories (keep in sync with API schema)
const CATEGORY_ENUM = [
  "foodDrink",
  "bathroom",
  "jewelery",
  "sports",
  "tech",
  "auto",
  "entertainment",
  "travel",
];

export const handler = async (event: any): Promise<ApiResponse> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // const stage = event.headers['X-Stage'] || 'dev';

  const data: CreateDealFormInput = JSON.parse(event.body);

  // Ensure dealId exists; generate on backend if not provided by client
  const dealId = KSUID.randomSync(new Date()).string;

  // Basic runtime validation aligned with API schema and frontend
  const validationError = validateInput(data);
  if (validationError) {
    return error(400, validationError);
  }

  // Parse the environment variables containing stage-specific resource names
  const tableNameEnv = process.env.TABLE_NAME;
  if (!tableNameEnv) {
    return error(500, "TABLE_NAME env var not set");
  }
  let tableName: string;
  try {
    const parsed = JSON.parse(tableNameEnv);
    tableName = typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    tableName = tableNameEnv;
  }
  if (!tableName) {
    return error(500, "TABLE_NAME env var is invalid");
  }

  // Prepare and save deal to DynamoDB
  const saveDealResult = await saveDealToDynamoDB(data, tableName, dealId);
  if (!saveDealResult.success) {
    return error(500, saveDealResult.error);
  }

  // Return success response
  const successResponse = success({
    message: "Deal successfully created",
    dealId: dealId,
  });
  console.log(`Success Response: ${JSON.stringify(successResponse, null, 2)}`);
  return successResponse;
};

/**
 * Save the deal to DynamoDB
 */
async function saveDealToDynamoDB(
  data: CreateDealFormInput,
  tableName: string,
  dealId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const dealItem: DealEntity = {
    PK: `DEAL#${dealId}`,
    SK: `DEAL#${dealId}`,
    EntityType: "Deal",
    Id: dealId,
    Title: data.title,
    OriginalPrice: parseFloat(data.originalPrice as any),
    Discount: parseFloat(data.discount as any),
    Category: data.category,
    Expiration: data.expiration,
    MerchantId: data.userId,
    LogoFileKey: data.logoFileKey,
    CreatedAt: new Date().toISOString(),
  };
  console.log("dealItem: " + JSON.stringify(dealItem, null, 2));

  try {
    console.log("(+) Saving deal to DynamoDB...");
    await ddbClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall(dealItem),
      })
    );

    return { success: true };
  } catch (err: unknown) {
    console.error("DynamoDB Error:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return { success: false, error: "Error saving deal: " + message };
  }
}

function validateInput(data: CreateDealFormInput): string | null {
  if (!data.userId || typeof data.userId !== "string")
    return "userId is required";
  if (!data.title || typeof data.title !== "string" || data.title.length > 255)
    return "title is required and must be <= 255 chars";

  const originalPrice = Number(data.originalPrice);
  if (!Number.isFinite(originalPrice) || originalPrice < 1)
    return "originalPrice must be a number >= 1";

  const discount = Number(data.discount);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100)
    return "discount must be between 0 and 100";

  if (!data.logoFileKey || typeof data.logoFileKey !== "string")
    return "logoFileKey is required";
  if (!CATEGORY_ENUM.includes(data.category)) return "category is invalid";

  if (!data.expiration || typeof data.expiration !== "string")
    return "expiration is required as ISO string";
  const expiresAt = Date.parse(data.expiration);
  if (Number.isNaN(expiresAt))
    return "expiration must be a valid ISO date-time";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);
  if (new Date(expiresAt) < minDate)
    return "expiration must be at least 7 days from today";

  return null;
}

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import KSUID from "ksuid";

/** @typedef {import('#types/deal-entity').DealEntity} DealItem */

// Api object provides internal API-related helper functionality
// such as standardized success and error responses
import Api from "#src/api/_index.js";

// Initialize AWS clients
const ddbClient = new DynamoDBClient();

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // const stage = event.headers['X-Stage'] || 'dev';

  const data = JSON.parse(event.body);

  // !!!!! VALIDATE expiration VALUE !!!!!
  // try {
  //   schema.validate(data);
  // } catch (error) {
  //   return Api.error(400, error.message);
  // }

  // Parse the environment variables containing stage-specific resource names
  const tableName = JSON.parse(process.env.TABLE_NAME);

  // Prepare and save deal to DynamoDB
  const saveDealResult = await saveDealToDynamoDB(data, tableName);
  if (!saveDealResult.success) {
    return Api.error(500, saveDealResult.error);
  }

  // Return success response
  const successResponse = Api.success({
    message: "Deal successfully created",
    dealId: data.dealId,
  });
  console.log(`Success Response: ${JSON.stringify(successResponse, null, 2)}`);
  return successResponse;
};

/**
 * Save the deal to DynamoDB
 * @param {Object} data - The deal data
 * @param {string} tableName - The DynamoDB table name
 * @returns {Object} Save result
 */
async function saveDealToDynamoDB(data, tableName) {
  /** @type {DealItem} */
  const dealItem = {
    PK: `DEAL#${data.dealId}`,
    SK: `DEAL#${data.dealId}`,
    EntityType: "Deal",
    Id: data.dealId,
    Title: data.title,
    OriginalPrice: parseFloat(data.originalPrice),
    Discount: parseFloat(data.discount),
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
  } catch (error) {
    console.error("DynamoDB Error:", error);
    return { success: false, error: "Error saving deal: " + error.message };
  }
}

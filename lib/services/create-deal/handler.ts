const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const KSUID = require("ksuid");

/** @typedef {import('#types/deal-entity').DealEntity} DealItem */

// Api object provides internal API-related helper functionality
// such as standardized success and error responses
const Api = require("#src/api/_index.js");

// Initialize AWS clients
const ddbClient = new DynamoDBClient();

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // const stage = event.headers['X-Stage'] || 'dev';

  data = JSON.parse(event.body);

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
    dealId: dealId,
  });
  console.log(`Success Response: ${JSON.stringify(successResponse, null, 2)}`);
  return successResponse;
};



/**
 * Save the deal to DynamoDB
 * @param {Object} deal - The deal data
 * @param {string} dbTableName - The DynamoDB table name
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
    OriginalPrice: parseFloat(deal.originalPrice),
    Discount: parseFloat(deal.discount),
    Category: deal.category,
    Expiration: deal.expiration,
    MerchantId: data.userId,
    LogoFileKey: data.logoFileKey,
    CreatedAt: new Date().toISOString(),
  };
  console.log("dealItem: " + JSON.stringify(dealItem, null, 2));

  try {
    console.log("(+) Saving deal to DynamoDB...")
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
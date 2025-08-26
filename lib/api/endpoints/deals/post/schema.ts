import { JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

const categoryEnum = [
  "foodDrink",
  "bathroom",
  "jewelery",
  "sports",
  "tech",
  "auto",
  "entertainment",
  "travel",
];

const schema: JsonSchema = {
  title: "CreateDealModel",
  type: JsonSchemaType.OBJECT,
  required: [
    "userId",
    "title",
    "originalPrice",
    "discount",
    "logoFileKey",
    "category",
    "expiration",
  ],
  properties: {
    userId: { type: JsonSchemaType.STRING, minLength: 1 },
    title: { type: JsonSchemaType.STRING, minLength: 1, maxLength: 255 },
    originalPrice: { type: JsonSchemaType.NUMBER, minimum: 1 },
    discount: { type: JsonSchemaType.NUMBER, minimum: 0, maximum: 100 },
    logoFileKey: { type: JsonSchemaType.STRING, minLength: 1 },
    category: { type: JsonSchemaType.STRING, enum: categoryEnum },
    // ISO 8601 date-time preferred for API payloads
    expiration: { type: JsonSchemaType.STRING, format: "date-time" },
  },
};

export default schema;

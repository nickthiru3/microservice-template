import type { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";

/**
 * Example DynamoDB stream processor.
 *
 * Template services should replace this handler with domain-specific logic
 * when enabling the stream consumer construct.
 */
export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  event.Records.forEach((record: DynamoDBRecord) => {
    console.log("[Stream] Received record", {
      eventName: record.eventName,
      keys: record.dynamodb?.Keys,
    });
  });
}

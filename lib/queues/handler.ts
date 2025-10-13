import type { SQSEvent, SQSRecord } from "aws-lambda";

/**
 * Example queue processor.
 *
 * Template services should replace this handler with domain-specific logic
 * when enabling the queue construct.
 */
export async function handler(event: SQSEvent): Promise<void> {
  event.Records.forEach((record: SQSRecord) => {
    console.log("[Queue] Received message", {
      messageId: record.messageId,
      body: record.body,
    });
  });
}

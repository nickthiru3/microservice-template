import { SNSEvent } from "aws-lambda";

/**
 * Sends a notification to Slack when a 4xx error is detected.
 * event SNSEvent
 */
export const handler = async (event: SNSEvent) => {
  const slackWebHookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebHookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is not defined");
  }

  for (const record of event.Records) {
    await fetch(slackWebHookUrl, {
      method: "POST",
      body: JSON.stringify({
        text: `${record.Sns.Message}`,
      }),
    });
  }
};

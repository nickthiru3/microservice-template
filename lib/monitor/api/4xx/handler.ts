import { SNSEvent } from "aws-lambda";

// Workspace: Super Deals Alarms -> App: Super Deals -> Channel: #api-4xx
const slackWebHookUrl =
  "https://hooks.slack.com/services/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";

/**
 * Sends a notification to Slack when a 4xx error is detected.
 * event SNSEvent
 */
export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    await fetch(slackWebHookUrl, {
      method: "POST",
      body: JSON.stringify({
        text: `${record.Sns.Message}`,
      }),
    });
  }
};

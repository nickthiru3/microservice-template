import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import DynamoThrottlesAlarmsConstruct from "#lib/monitor/alarms/dynamodb-throttles/construct";
import type { IConfig } from "#config/default";

describe("DynamoThrottlesAlarmsConstruct", () => {
  it("creates read/write throttle alarms for each table", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");

    const config = {
      envName: "dev",
      accountId: "123456789012",
      region: "us-east-1",
      service: { name: "resource", displayName: "Resource" },
      resources: {
        tablePrefix: "resource",
        bucketPrefix: "resource",
        functionPrefix: "resource",
        apiPrefix: "resource",
      },
    } as unknown as IConfig;

    const table = new TableV2(stack, "Table", {
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
    });

    new DynamoThrottlesAlarmsConstruct(stack, "Throttles", {
      config,
      tables: [table],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 2);
  });
});

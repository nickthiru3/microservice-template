import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import S3FailureAlarmsConstruct from "#lib/monitor/alarms/s3-failures/construct";
import type { IConfig } from "#config/default";

describe("S3FailureAlarmsConstruct", () => {
  it("creates an alarm per bucket", () => {
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

    const bucket = new Bucket(stack, "Bucket");

    new S3FailureAlarmsConstruct(stack, "S3Alarms", {
      config,
      buckets: [bucket],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 1);
  });
});

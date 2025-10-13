jest.mock("aws-cdk-lib/aws-lambda-nodejs", () => {
  const actual = jest.requireActual("aws-cdk-lib/aws-lambda-nodejs");
  const lambda = jest.requireActual("aws-cdk-lib/aws-lambda");

  class MockNodejsFunction extends lambda.Function {
    constructor(scope: any, id: string, props: any = {}) {
      const { bundling, entry, depsLockFilePath, ...rest } = props ?? {};

      super(scope, id, {
        ...rest,
        code:
          rest?.code ?? lambda.Code.fromInline("exports.handler = async () => {}"),
        handler: rest?.handler ?? "index.handler",
        runtime: rest?.runtime ?? lambda.Runtime.NODEJS_20_X,
      });
    }
  }

  return {
    ...actual,
    NodejsFunction: MockNodejsFunction,
  };
});

import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";
import { Function as LambdaFunction, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import SchedulerConstruct from "#lib/scheduler/construct";
import type { IConfig } from "#config/default";

describe("SchedulerConstruct", () => {
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

  it("creates default Lambda when none supplied", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");

    new SchedulerConstruct(stack, "Scheduler", { config });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::Events::Rule", 1);
  });

  it("uses provided lambda and schedule", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");

    const customLambda = new LambdaFunction(stack, "CustomLambda", {
      runtime: Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: Code.fromInline("exports.handler = async () => {}"),
    });

    new SchedulerConstruct(stack, "Scheduler", {
      config,
      lambda: customLambda,
      schedule: Schedule.rate(Duration.minutes(5)),
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.hasResourceProperties("AWS::Events::Rule", {
      ScheduleExpression: "rate(5 minutes)",
    });
  });
});

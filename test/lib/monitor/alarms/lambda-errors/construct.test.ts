import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import LambdaErrorAlarmsConstruct from "#lib/monitor/alarms/lambda-errors/construct";
import type { IConfig } from "#config/default";

describe("LambdaErrorAlarmsConstruct", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let config: IConfig;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");

    config = {
      envName: "dev",
      accountId: "123456789012",
      region: "us-east-1",
      service: {
        name: "resource",
        displayName: "Resource",
      },
      resources: {
        tablePrefix: "resource",
        bucketPrefix: "resource",
        functionPrefix: "resource",
        apiPrefix: "resource",
      },
    } as unknown as IConfig;
  });

  it("creates an alarm per lambda target", () => {
    const fnOne = new lambda.Function(stack, "FnOne", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline("exports.handler = async () => {}"),
    });

    const fnTwo = new lambda.Function(stack, "FnTwo", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline("exports.handler = async () => {}"),
    });

    new LambdaErrorAlarmsConstruct(stack, "LambdaErrors", {
      config,
      lambdaFunctions: [fnOne, fnTwo],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 2);
  });
});

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
import { Template, Match } from "aws-cdk-lib/assertions";
import { TableV2, AttributeType, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import StreamConsumerConstruct from "#lib/db/stream-consumer/construct";
import type { IConfig } from "#config/default";

describe("StreamConsumerConstruct", () => {
  it("creates lambda with DynamoDB event source", () => {
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
      dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    new StreamConsumerConstruct(stack, "StreamConsumer", {
      config,
      table,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);
    template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike({
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          TABLE_NAME: Match.anyValue(),
        }),
      }),
    }));
  });
});

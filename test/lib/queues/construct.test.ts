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
import { Topic } from "aws-cdk-lib/aws-sns";
import QueueConstruct from "#lib/queues/construct";
import type { IConfig } from "#config/default";

describe("QueueConstruct", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  const config: IConfig = {
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
    features: {},
  } as unknown as IConfig;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");
  });

  it("creates primary queue with DLQ redrive policy", () => {
    new QueueConstruct(stack, "QueueConstruct", { config });

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", Match.objectLike({
      QueueName: "resource-queue",
      RedrivePolicy: Match.objectLike({
        maxReceiveCount: 3,
        deadLetterTargetArn: Match.anyValue(),
      }),
    }));
  });

  it("creates dead-letter queue retained for 14 days", () => {
    new QueueConstruct(stack, "QueueConstruct", { config });

    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::SQS::Queue", Match.objectLike({
      QueueName: "resource-dlq",
      MessageRetentionPeriod: 1209600,
    }));
  });

  it("connects Lambda consumer via event source mapping", () => {
    new QueueConstruct(stack, "QueueConstruct", { config });

    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);
  });

  it("can subscribe to an SNS topic", () => {
    const topic = new Topic(stack, "Topic", { topicName: "resource-topic" });

    new QueueConstruct(stack, "QueueConstruct", {
      config,
      subscribeToTopic: topic,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::SNS::Subscription", Match.objectLike({
      Protocol: "sqs",
    }));
  });
});

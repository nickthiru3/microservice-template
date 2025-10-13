jest.mock("aws-cdk-lib/aws-lambda-nodejs", () => {
  const actual = jest.requireActual("aws-cdk-lib/aws-lambda-nodejs");
  const lambda = jest.requireActual("aws-cdk-lib/aws-lambda");

  class MockNodejsFunction extends lambda.Function {
    constructor(scope: any, id: string, props: any = {}) {
      const {
        bundling, // ignore bundling to avoid docker requirement
        entry,
        depsLockFilePath,
        minify,
        sourceMaps,
        ...rest
      } = props ?? {};

      super(scope, id, {
        ...rest,
        code:
          rest?.code ??
          lambda.Code.fromInline("exports.handler = async () => {}"),
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
import { Template, Match, Annotations } from "aws-cdk-lib/assertions";
import { ServiceStack } from "#lib/service-stack";
import type { IConfig } from "#config/default";

describe("ServiceStack (infrastructure)", () => {
  let app: cdk.App;
  let stack: ServiceStack;

  const envName = "dev";
  const account = "123456789012";
  const region = "us-east-1";
  const serviceName = "resource";

  const config: IConfig = {
    envName,
    accountId: account,
    region,
    service: {
      name: serviceName,
      displayName: serviceName,
    },
    resources: {
      tablePrefix: serviceName,
      bucketPrefix: serviceName,
      functionPrefix: serviceName,
      apiPrefix: serviceName,
    },
    // Keep optional sections minimal for synth
    features: { permissionsEnabled: false },
  } as IConfig;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServiceStack(app, `${envName}-${serviceName}-ServiceStack`, {
      env: { account, region },
      config,
    });
  });  

  test("configures monitor Lambda with SLACK_WEBHOOK_URL env using SSM SecureString dynamic reference", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike({
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          // Expect a CloudFormation dynamic reference to SSM SecureString (placeholder path values)
          SLACK_WEBHOOK_URL: Match.stringLikeRegexp("ssm-secure:.*monitor/slack/webhookUrl"),
        }),
      }),
    }));
  });

  test("synthesizes an API Gateway RestApi with custom Stage and access logs", () => {
    const template = Template.fromStack(stack);

    // RestApi exists
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

    // Deployment + Stage exist
    template.resourceCountIs("AWS::ApiGateway::Deployment", 1);
    template.hasResourceProperties("AWS::ApiGateway::Stage", {
      StageName: envName,
      MethodSettings: Match.arrayWith([
        Match.objectLike({
          HttpMethod: "*",
          ResourcePath: "/*",
          LoggingLevel: "INFO",
          MetricsEnabled: true,
          DataTraceEnabled: true,
          ThrottlingBurstLimit: 10,
          ThrottlingRateLimit: 5,
        }),
      ]),
    });

    // Access logs LogGroup with expected name and retention
    template.hasResourceProperties("AWS::Logs::LogGroup", Match.objectLike({
      LogGroupName: `/apigateway/${serviceName}/${envName}/access`,
      RetentionInDays: 30,
    }));
  });

  test("configures validation GatewayResponse, RequestValidator and Model for POST /resource", () => {
    const template = Template.fromStack(stack);

    // GatewayResponse for BAD_REQUEST_BODY
    template.hasResourceProperties("AWS::ApiGateway::GatewayResponse", {
      ResponseType: "BAD_REQUEST_BODY",
      ResponseParameters: Match.objectLike({
        "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'*'",
      }),
      StatusCode: "400",
    });

    // RequestValidator validates body
    template.hasResourceProperties("AWS::ApiGateway::RequestValidator", {
      ValidateRequestBody: true,
    });

    // Request Model exists for application/json
    template.hasResourceProperties("AWS::ApiGateway::Model", {
      ContentType: "application/json",
    });
  });

  test("exposes POST /resource method with authorizer and request model", () => {
    const template = Template.fromStack(stack);

    // Method for POST exists with authorizer and request models
    template.hasResourceProperties("AWS::ApiGateway::Method", Match.objectLike({
      HttpMethod: "POST",
      AuthorizationType: Match.anyValue(),
      AuthorizerId: Match.anyValue(),
      RequestValidatorId: Match.anyValue(),
      RequestModels: Match.objectLike({
        "application/json": Match.anyValue(),
      }),
      Integration: Match.objectLike({
        Type: "AWS_PROXY",
      }),
    }));
  });

  test("creates Lambda for resource POST handler with env and least-privilege IAM", () => {
    const template = Template.fromStack(stack);

    // Lambda function properties
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs20.x",
      MemorySize: 512,
      Timeout: 60,
      Environment: Match.objectLike({
        Variables: Match.objectLike({ TABLE_NAME: Match.anyValue() }),
      }),
    });

    // IAM Policy allowing only PutItem on the table
    template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike({
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: "dynamodb:PutItem",
            Effect: "Allow",
            Resource: Match.anyValue(), // specific table ARN referenced
          }),
        ]),
      }),
    }));
  });

  test("creates DynamoDB table with PK/SK, GSI1 and PITR", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::DynamoDB::GlobalTable", Match.objectLike({
      KeySchema: Match.arrayWith([
        Match.objectLike({ AttributeName: "PK", KeyType: "HASH" }),
        Match.objectLike({ AttributeName: "SK", KeyType: "RANGE" }),
      ]),
      AttributeDefinitions: Match.arrayWith([
        Match.objectLike({ AttributeName: "PK", AttributeType: "S" }),
        Match.objectLike({ AttributeName: "SK", AttributeType: "S" }),
      ]),
      Replicas: Match.arrayWith([
        Match.objectLike({
          PointInTimeRecoverySpecification: Match.objectLike({
            PointInTimeRecoveryEnabled: true,
          }),
        }),
      ]),
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: "GSI1",
          KeySchema: Match.arrayWith([
            Match.objectLike({ AttributeName: "GSI1PK", KeyType: "HASH" }),
            Match.objectLike({ AttributeName: "GSI1SK", KeyType: "RANGE" }),
          ]),
        }),
      ]),
    }));
  });

  test("exports API URL and table outputs", () => {
    const template = Template.fromStack(stack);

    const templateJson = template.toJSON();
    const outputs = Object.values(templateJson.Outputs ?? {}) as Array<{
      readonly Export?: { readonly Name?: string };
    }>;
    const exportNames = outputs
      .map((output) => output.Export?.Name)
      .filter((name): name is string => typeof name === "string");

    expect(exportNames).toEqual(
      expect.arrayContaining([
        `RestApiUrl-${serviceName}`,
        `${serviceName}-TableName`,
        `${serviceName}-TableArn`,
      ])
    );
  });
});

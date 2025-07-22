import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Deployment,
  Stage,
  LogGroupLogDestination,
  AccessLogFormat,
  MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnOutput } from "aws-cdk-lib";

class StageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { api, stageName } = props;

    const accessLogGroup = new LogGroup(this, `LogGroup-${stageName}`, {
      logGroupName: `/aws/apigateway/${api.restApiId}/${stageName}`,
      retention: RetentionDays.ONE_WEEK,
    });

    // const executionLogGroup = new LogGroup(this, `ExecutionLogGroup-${stageName}`, {
    //   logGroupName: `/aws/apigateway/${api.restApiId}/${stageName}/execution`,
    //   retention: RetentionDays.ONE_WEEK
    // });

    const deployment = new Deployment(this, `Deployment-${stageName}`, {
      api,
    });

    const stage = new Stage(this, `Stage-${stageName}`, {
      deployment,
      stageName,
      accessLogDestination: new LogGroupLogDestination(accessLogGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        caller: false,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
      methodSettings: [
        {
          loggingLevel: MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          resourcePath: "/*",
          httpMethod: "*",
          throttlingBurstLimit: 10,
          throttlingRateLimit: 5,
        },
      ],
    });

    // Set the default deployment stage
    if (stageName === "dev") {
      api.deploymentStage = stage;
    }

    // Output the stage-specific URL with custom LogicalId (in outputs.json)
    new CfnOutput(this, `RestApiUrl-${stageName}`, {
      value: stage.urlForPath(),
      exportName: `RestApiUrl${stageName}`,
    }).overrideLogicalId(`RestApiUrl${stageName}`);
  }
}

export default StageStack;

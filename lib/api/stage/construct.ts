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
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { RestApi } from "aws-cdk-lib/aws-apigateway";

interface StageConstructProps {
  readonly api: RestApi;
  readonly stageName: string;
}

class StageConstruct extends Construct {
  constructor(scope: Construct, id: string, props: StageConstructProps) {
    super(scope, id);

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
      methodOptions: {
        "/*/*": {
          loggingLevel: MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
          throttlingBurstLimit: 10,
          throttlingRateLimit: 5,
        },
      },
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

    // Publish API base URL to SSM for service discovery
    const basePath = `/super-deals/${stageName}/deals-ms/public`;
    new StringParameter(this, `ParamApiBaseUrl-${stageName}`, {
      parameterName: `${basePath}/api/baseUrl`,
      stringValue: stage.urlForPath(),
    });
  }
}

export default StageConstruct;

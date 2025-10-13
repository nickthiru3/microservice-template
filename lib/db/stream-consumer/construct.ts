import { Construct } from "constructs";
import { Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import type { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { IConfig } from "#config/default";
import path from "path";

interface IStreamConsumerConstructProps {
  readonly config: IConfig;
  readonly table: TableV2;
}

class StreamConsumerConstruct extends Construct {
  readonly lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: IStreamConsumerConstructProps) {
    super(scope, id);

    const { config, table } = props;

    this.lambda = new NodejsFunction(this, "StreamConsumerFunction", {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.minutes(1),
      entry: path.join(__dirname, "./handler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
        SERVICE_NAME: config.service.name,
      },
    });

    this.lambda.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        bisectBatchOnError: true,
        retryAttempts: 2,
      })
    );

    table.grantStreamRead(this.lambda);
  }
}

export default StreamConsumerConstruct;

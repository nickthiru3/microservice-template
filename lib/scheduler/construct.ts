import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction as LambdaTarget } from "aws-cdk-lib/aws-events-targets";
import { Runtime, type IFunction } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import path from "path";
import type { IConfig } from "#config/default";

interface ISchedulerConstructProps {
  readonly config: IConfig;
  readonly schedule?: Schedule;
  readonly lambda?: IFunction;
}

class SchedulerConstruct extends Construct {
  readonly lambda: IFunction;

  constructor(scope: Construct, id: string, props: ISchedulerConstructProps) {
    super(scope, id);

    const { config, schedule, lambda } = props;

    const targetLambda =
      lambda ??
      new NodejsFunction(this, "SchedulerFunction", {
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.minutes(1),
        entry: path.join(__dirname, "./handler.ts"),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk"],
          forceDockerBundling: true,
        },
        environment: {
          SERVICE_NAME: config.service.name,
        },
        depsLockFilePath: path.join(__dirname, "../../package-lock.json"),
      });

    this.lambda = targetLambda;

    new Rule(this, "SchedulerRule", {
      schedule: schedule ?? Schedule.rate(Duration.hours(1)),
      targets: [new LambdaTarget(targetLambda)],
    });
  }
}

export default SchedulerConstruct;

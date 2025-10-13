import { Construct } from "constructs";
import { Alarm } from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import { type IFunction } from "aws-cdk-lib/aws-lambda";
import type { IConfig } from "#config/default";

interface ILambdaErrorAlarmsConstructProps {
  readonly config: IConfig;
  readonly lambdaFunctions: IFunction[];
}

class LambdaErrorAlarmsConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ILambdaErrorAlarmsConstructProps
  ) {
    super(scope, id);

    const { config, lambdaFunctions } = props;

    lambdaFunctions.forEach((fn, index) => {
      const sanitizedId = fn.node.path.replace(/[^A-Za-z0-9]/g, "") || `Fn${index}`;

      const metric = fn.metricErrors({
        period: Duration.minutes(5),
        statistic: "Sum",
      });

      new Alarm(this, `LambdaErrors${sanitizedId}`, {
        alarmName: `${config.service.name}-${fn.node.id}-LambdaErrors`,
        alarmDescription: `Lambda ${fn.functionName} is recording errors`,
        metric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
      });
    });
  }
}

export default LambdaErrorAlarmsConstruct;

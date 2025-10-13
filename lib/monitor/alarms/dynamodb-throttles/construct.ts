import { Construct } from "constructs";
import { Alarm } from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import type { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { IConfig } from "#config/default";

interface IDynamoThrottlesAlarmsConstructProps {
  readonly config: IConfig;
  readonly tables: TableV2[];
}

class DynamoThrottlesAlarmsConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: IDynamoThrottlesAlarmsConstructProps
  ) {
    super(scope, id);

    const { config, tables } = props;

    tables.forEach((table, index) => {
      const tableId = table.tableName.replace(/[^A-Za-z0-9]/g, "") || `Table${index}`;

      const readThrottleMetric = table.metric("ReadThrottleEvents", {
        period: Duration.minutes(5),
        statistic: "Sum",
      });

      const writeThrottleMetric = table.metric("WriteThrottleEvents", {
        period: Duration.minutes(5),
        statistic: "Sum",
      });

      new Alarm(this, `DynamoReadThrottle${tableId}`, {
        alarmName: `${config.service.name}-${table.tableName}-ReadThrottles`,
        alarmDescription: `DynamoDB table ${table.tableName} has read throttle events`,
        metric: readThrottleMetric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
      });

      new Alarm(this, `DynamoWriteThrottle${tableId}`, {
        alarmName: `${config.service.name}-${table.tableName}-WriteThrottles`,
        alarmDescription: `DynamoDB table ${table.tableName} has write throttle events`,
        metric: writeThrottleMetric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
      });
    });
  }
}

export default DynamoThrottlesAlarmsConstruct;

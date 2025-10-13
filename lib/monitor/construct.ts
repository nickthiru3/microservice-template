/**
 * Monitoring Infrastructure
 *
 * Creates CloudWatch monitoring resources for the template service.
 * Currently provisions API Gateway alarms and dashboards.
 *
 * Architecture:
 * ```
 * MonitorConstruct
 * └── ApiMonitorConstruct
 *     ├── CloudWatch alarms (5xx, latency, throttles)
 *     └── Dashboards and SNS notifications (future)
 * ```
 *
 * @module lib/monitor/construct
 */

import { Construct } from "constructs";
import ApiMonitorConstruct from "./api/construct";
import LambdaErrorAlarmsConstruct from "./alarms/lambda-errors/construct";
import DynamoThrottlesAlarmsConstruct from "./alarms/dynamodb-throttles/construct";
import S3FailureAlarmsConstruct from "./alarms/s3-failures/construct";
import SsmBindingsConstruct from "#lib/ssm-bindings/construct";
import type { IConfig } from "#config/default";
import type { IFunction } from "aws-cdk-lib/aws-lambda";
import type { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { Bucket } from "aws-cdk-lib/aws-s3";

/**
 * Props for MonitorConstruct
 *
 * @property config - Application configuration (env, service metadata)
 * @property ssmBindings - SSM bindings for sharing monitor outputs
 */
export interface IMonitorTargets {
  readonly lambdaFunctions?: IFunction[];
  readonly dynamoTables?: TableV2[];
  readonly buckets?: Bucket[];
}

interface IMonitorConstructProps {
  readonly config: IConfig;
  readonly ssmBindings: SsmBindingsConstruct;
  readonly targets?: IMonitorTargets;
}

/**
 * Monitor Construct
 *
 * Orchestrates all monitoring resources for the primary resource service.
 * Currently delegates to `ApiMonitorConstruct` for API Gateway metrics.
 *
 * @example
 * new MonitorConstruct(this, 'MonitorConstruct', {
 *   config: appConfig,
 *   ssmBindings: ssmBindings
 * });
 */
class MonitorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IMonitorConstructProps) {
    super(scope, id);

    const { config, ssmBindings, targets } = props;
    const lambdaFunctions = targets?.lambdaFunctions ?? [];
    const dynamoTables = targets?.dynamoTables ?? [];
    const buckets = targets?.buckets ?? [];

    new ApiMonitorConstruct(this, "ApiMonitorConstruct", {
      config,
      ssmBindings,
    });

    if (config.features?.monitoringLambdaErrorsEnabled && lambdaFunctions.length) {
      new LambdaErrorAlarmsConstruct(this, "LambdaErrorAlarmsConstruct", {
        config,
        lambdaFunctions,
      });
    }

    if (config.features?.monitoringDynamoThrottlesEnabled && dynamoTables.length) {
      new DynamoThrottlesAlarmsConstruct(this, "DynamoThrottlesAlarmsConstruct", {
        config,
        tables: dynamoTables,
      });
    }

    if (config.features?.monitoringS3FailuresEnabled && buckets.length) {
      new S3FailureAlarmsConstruct(this, "S3FailureAlarmsConstruct", {
        config,
        buckets,
      });
    }
  }
}

export default MonitorConstruct;

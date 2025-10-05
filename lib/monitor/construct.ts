/**
 * Monitoring Infrastructure
 *
 * Creates CloudWatch monitoring resources for the deals microservice.
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
import SsmBindingsConstruct from "#lib/ssm-bindings/construct.js";
import type { IConfig } from "#config/default";

/**
 * Props for MonitorConstruct
 *
 * @property config - Application configuration (env, service metadata)
 * @property ssmBindings - SSM bindings for sharing monitor outputs
 */
interface IMonitorConstructProps {
  readonly config: IConfig;
  readonly ssmBindings: SsmBindingsConstruct;
}

/**
 * Monitor Construct
 *
 * Orchestrates all monitoring resources for the deals microservice.
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

    const { config, ssmBindings } = props;

    new ApiMonitorConstruct(this, "ApiMonitorConstruct", {
      config,
      ssmBindings,
    });
  }
}

export default MonitorConstruct;

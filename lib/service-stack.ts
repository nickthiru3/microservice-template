/**
 * Primary microservice infrastructure stack
 *
 * Main CDK stack that orchestrates all infrastructure for the template service.
 * Creates and wires together AWS resources in the correct dependency order.
 *
 * Architecture:
 * ```
 * ServiceStack
 * ├── SsmBindingsConstruct (external config bindings)
 * ├── MonitorConstruct (CloudWatch, SNS)
 * ├── DatabaseConstruct (DynamoDB)
 * ├── StorageConstruct (S3 for resource assets)
 * ├── PermissionsConstruct (OAuth scopes)
 * └── ApiConstruct (API Gateway + Lambda endpoints)
 *     └── ResourceEndpointsConstruct
 *         └── POST /resource (create resource)
 * ```
 *
 * Dependency Flow:
 * 1. SsmBindings - Reads external configs (website URL)
 * 2. Monitor - Sets up monitoring (independent)
 * 3. Database - Creates DynamoDB table (independent)
 * 4. Storage - Creates S3 bucket for resource assets (independent)
 * 5. Permissions - Defines OAuth scopes (depends on SsmBindings, Storage)
 * 6. API - Creates endpoints (depends on Database, SsmBindings, Permissions)
 *
 * @module lib/service-stack
 */

import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import SsmBindingsConstruct from "./ssm-bindings/construct";
import MonitorConstruct, { type IMonitorTargets } from "./monitor/construct";
import DatabaseConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import QueueConstruct from "./queues/construct";
import StreamConsumerConstruct from "./db/stream-consumer/construct";
import SchedulerConstruct from "./scheduler/construct";
import SecretsConstruct from "./secrets/construct";
import PermissionsConstruct, {
  NoopPermissionsConstruct,
  type IPermissionsProvider,
} from "./permissions/construct";
import ApiConstruct from "./api/construct";
// import EventsConstruct from "./events/construct";
// import SsmPublicationsConstruct from "./ssm-publications/construct";
import type { IConfig } from "#config/default";
import type { IFunction } from "aws-cdk-lib/aws-lambda";

/**
 * Props for ServiceStack
 *
 * @property config - Application configuration (environment, service name, etc.)
 */
interface IServiceStackProps extends StackProps {
  readonly config: IConfig;
}

/**
 * Primary microservice stack
 *
 * Orchestrates infrastructure for the template service.
 * Creates resources in dependency order to ensure proper wiring.
 *
 * Features:
 * - DynamoDB single-table design for primary resource
 * - S3 storage for resource assets
 * - API Gateway with Lambda endpoints
 * - OAuth 2.0 authorization with scopes
 * - CloudWatch monitoring and alarms
 * - SSM Parameter Store for service discovery
 *
 * @example
 * // Create primary microservice stack
 * new ServiceStack(app, 'TemplateStack', {
 *   config: appConfig,
 *   env: {
 *     account: process.env.CDK_DEFAULT_ACCOUNT,
 *     region: process.env.CDK_DEFAULT_REGION
 *   }
 * });
 */
export class ServiceStack extends Stack {
  /**
   * Creates the service stack
   *
   * Orchestrates infrastructure creation in dependency order:
   * 1. External bindings (SSM)
   * 2. Monitoring (CloudWatch, SNS)
   * 3. Database (DynamoDB)
   * 4. Storage (S3)
   * 5. Permissions (OAuth scopes)
   * 6. API (API Gateway + Lambda)
   *
   * @param scope - Parent construct (usually App)
   * @param id - Stack identifier
   * @param props - Stack configuration properties
   */
  constructor(scope: Construct, id: string, props: IServiceStackProps) {
    super(scope, id, props);

    const { config } = props;

    // 1. SSM Bindings - Read external service configurations
    const ssmBindings = new SsmBindingsConstruct(this, "SsmBindingsConstruct", {
      config,
    });

    const monitorLambdaTargets: IFunction[] = [];

    // 2. Database - DynamoDB table for primary resources
    const db = new DatabaseConstruct(this, "DatabaseConstruct", {
      config,
    });

    // 3. Storage - S3 bucket for resource assets
    const storage = new StorageConstruct(this, "StorageConstruct", {
      config,
    });

    // 4. Permissions - OAuth 2.0 scopes for API authorization (feature-flagged)
    const permissions: IPermissionsProvider = config.features?.permissionsEnabled
      ? new PermissionsConstruct(this, "PermissionsConstruct", {
          config,
          ssmBindings,
          storage,
        })
      : new NoopPermissionsConstruct();

    // 5. Queues - Optional asynchronous processing pipeline
    if (config.features?.queuesEnabled) {
      const queueConstruct = new QueueConstruct(this, "QueueConstruct", {
        config,
      });
      monitorLambdaTargets.push(queueConstruct.handler);
    }

    // 6. DynamoDB Streams - Optional change data capture
    if (config.features?.dynamodbStreamsEnabled) {
      const streamConsumer = new StreamConsumerConstruct(
        this,
        "StreamConsumerConstruct",
        {
          config,
          table: db.table,
        }
      );
      monitorLambdaTargets.push(streamConsumer.lambda);
    }

    // 7. Scheduler - Optional scheduled workloads
    if (config.features?.schedulerEnabled) {
      const scheduler = new SchedulerConstruct(this, "SchedulerConstruct", {
        config,
      });
      monitorLambdaTargets.push(scheduler.lambda);
    }

    // 8. Secrets Manager - Optional secret provisioning
    if (config.features?.secretsManagerEnabled) {
      new SecretsConstruct(this, "SecretsConstruct", {
        config,
      });
    }

    const monitorTargets: IMonitorTargets = {
      lambdaFunctions: monitorLambdaTargets.length
        ? monitorLambdaTargets
        : undefined,
      dynamoTables: [db.table],
      buckets: [storage.s3Bucket],
    };

    // 9. Monitoring - CloudWatch alarms and dashboards
    new MonitorConstruct(this, "MonitorConstruct", {
      config,
      ssmBindings,
      targets: monitorTargets,
    });

    // 10. API - API Gateway with Lambda endpoints
    new ApiConstruct(this, "ApiConstruct", {
      config,
      db,
      ssmBindings,
      permissions,
    });

    // Future: SNS/EventBridge events for resource lifecycle
    // new EventsConstruct(this, "EventsConstruct", {
    //   config,
    // });

    // Optional: Publish service-owned configuration values for other services
    // new SsmPublicationsConstruct(this, "SsmPublicationsConstruct", {
    //   config,
    //   values: {
    //     ExampleApiUrl: `https://${config.service.name}.example.com`;
    //   },
    //   basePath: config.parameterStorePrefix ?? "/example-app",
    // });
  }
}

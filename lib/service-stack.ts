/**
 * Deals Microservice Infrastructure Stack
 *
 * Main CDK stack that orchestrates all infrastructure for the deals microservice.
 * Creates and wires together all AWS resources in the correct dependency order.
 *
 * Architecture:
 * ```
 * ServiceStack
 * ├── SsmBindingsConstruct (external config bindings)
 * ├── MonitorConstruct (CloudWatch, SNS)
 * ├── DatabaseConstruct (DynamoDB)
 * ├── StorageConstruct (S3 for deal logos)
 * ├── PermissionsConstruct (OAuth scopes)
 * └── ApiConstruct (API Gateway + Lambda endpoints)
 *     └── DealsConstruct
 *         └── POST /deals (create deal)
 * ```
 *
 * Dependency Flow:
 * 1. SsmBindings - Reads external configs (website URL)
 * 2. Monitor - Sets up monitoring (independent)
 * 3. Database - Creates DynamoDB table (independent)
 * 4. Storage - Creates S3 bucket for logos (independent)
 * 5. Permissions - Defines OAuth scopes (depends on SsmBindings, Storage)
 * 6. API - Creates endpoints (depends on Database, SsmBindings, Permissions)
 *
 * @module lib/service-stack
 */

import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import SsmBindingsConstruct from "./ssm-bindings/construct";
import MonitorConstruct from "./monitor/construct";
import DatabaseConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import PermissionsConstruct from "./permissions/construct";
import ApiConstruct from "./api/construct";
// import EventsConstruct from "./events/construct";
import type { IConfig } from "#config/default";

/**
 * Props for ServiceStack
 *
 * @property config - Application configuration (environment, service name, etc.)
 */
interface IServiceStackProps extends StackProps {
  readonly config: IConfig;
}

/**
 * Deals Microservice Stack
 *
 * Orchestrates all infrastructure for the deals microservice.
 * Creates resources in dependency order to ensure proper wiring.
 *
 * Features:
 * - DynamoDB single-table design for deals
 * - S3 storage for deal logo images
 * - API Gateway with Lambda endpoints
 * - OAuth 2.0 authorization with scopes
 * - CloudWatch monitoring and alarms
 * - SSM Parameter Store for service discovery
 *
 * @example
 * // Create deals microservice stack
 * new ServiceStack(app, 'DealsStack', {
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

    // 2. Monitoring - CloudWatch alarms and SNS notifications
    new MonitorConstruct(this, "MonitorConstruct", {
      config,
      ssmBindings,
    });

    // 3. Database - DynamoDB table for deals
    const db = new DatabaseConstruct(this, "DatabaseConstruct", {
      config,
    });

    // 4. Storage - S3 bucket for deal logo images
    const storage = new StorageConstruct(this, "StorageConstruct", {
      config,
    });

    // 5. Permissions - OAuth 2.0 scopes for API authorization
    const permissions = new PermissionsConstruct(this, "PermissionsConstruct", {
      config,
      ssmBindings,
      storage,
    });

    // 6. API - API Gateway with Lambda endpoints
    new ApiConstruct(this, "ApiConstruct", {
      config,
      db,
      ssmBindings,
      permissions,
    });

    // Future: EventBridge events for deal lifecycle
    // new EventsConstruct(this, "EventsConstruct", {
    //   config,
    // });
  }
}

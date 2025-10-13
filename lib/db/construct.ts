/**
 * DynamoDB Database Infrastructure
 *
 * Creates DynamoDB table using single-table design pattern.
 * Stores all primary resource entities in one table with GSI for flexible querying.
 *
 * Table Schema:
 * - Primary Key: PK (partition key), SK (sort key)
 * - GSI1: GSI1PK (partition key), GSI1SK (sort key)
 *
 * Entity Patterns:
 * - Resource: PK=RESOURCE#{resourceId}, SK=RESOURCE#{resourceId}
 * - Future: Merchant resources: GSI1PK=MERCHANT#{merchantId}, GSI1SK=RESOURCE#{resourceId}
 * - Future: Category resources: GSI1PK=CATEGORY#{category}, GSI1SK=RESOURCE#{resourceId}
 *
 * Features:
 * - Point-in-time recovery enabled
 * - Deletion protection in production/staging
 * - Auto-cleanup in dev/local environments
 *
 * @module lib/db/construct
 */

import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { TableV2, AttributeType, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import type { IConfig } from "#config/default";

/**
 * Props for DatabaseConstruct
 *
 * @property config - Application configuration
 */
export interface IDatabaseConstructProps {
  readonly config: IConfig;
}

/**
 * Database Construct
 *
 * Creates DynamoDB table with single-table design for the primary resource.
 * Includes GSI for flexible querying patterns.
 *
 * @example
 * // Create database construct
 * const db = new DatabaseConstruct(this, 'DatabaseConstruct', {
 *   config: appConfig
 * });
 *
 * // Grant Lambda read/write access
 * db.table.grantReadWriteData(lambda);
 */
class DatabaseConstruct extends Construct {
  /**
   * DynamoDB table instance
   *
   * Public property to allow:
   * - Lambda functions to read/write data
   * - IAM policies to grant permissions
   * - Other constructs to reference table name/ARN
   */
  public readonly table: TableV2;

  /**
   * Creates the database construct
   *
   * Creates:
   * 1. DynamoDB table with PK/SK
   * 2. GSI1 for alternate query patterns
   * 3. Point-in-time recovery
   * 4. CloudFormation outputs
   *
   * @param scope - Parent construct
   * @param id - Construct identifier
   * @param props - Configuration properties
   */
  constructor(scope: Construct, id: string, props: IDatabaseConstructProps) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;
    const serviceName = config.service.name;

    // Protect data in production/staging; allow easy cleanup in dev/local
    const shouldProtectFromDeletion = envName !== "local" && envName !== "dev";

    // Create DynamoDB table with single-table design
    const enableStreams = config.features?.dynamodbStreamsEnabled ?? false;

    this.table = new TableV2(this, "Table", {
      // Primary key for main access patterns
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      // GSI1 for alternate query patterns (merchant resources, category resources)
      globalSecondaryIndexes: [
        {
          indexName: "GSI1",
          partitionKey: {
            name: "GSI1PK",
            type: AttributeType.STRING,
          },
          sortKey: {
            name: "GSI1SK",
            type: AttributeType.STRING,
          },
        },
      ],
      // Prevent accidental deletion in production/staging
      deletionProtection: shouldProtectFromDeletion,
      // Enable point-in-time recovery for data protection
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      // Retain table in production/staging, destroy in dev/local
      removalPolicy: shouldProtectFromDeletion
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      dynamoStream: enableStreams ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,
    });

    const tableName = this.table.tableName;
    const tableArn = this.table.tableArn;

    // Export table name for Lambda environment variables
    new CfnOutput(this, "TableName", {
      value: tableName,
      description: "DynamoDB table name",
      exportName: `${serviceName}-TableName`,
    });

    // Export table ARN for IAM policies
    new CfnOutput(this, "TableArn", {
      value: tableArn,
      description: "DynamoDB table ARN",
      exportName: `${serviceName}-TableArn`,
    });
  }
}

export default DatabaseConstruct;

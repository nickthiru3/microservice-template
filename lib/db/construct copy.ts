import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  TableV2,
  AttributeType,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { databaseConfig, GSIConfig } from "#config/database";

/**
 * Properties for the DynamoDB construct
 */
export interface DbConstructProps {
  /**
   * Environment name (e.g., 'local', 'staging', 'production')
   */
  readonly envName: string;

  /**
   * Service name for resource naming and tagging
   */
  readonly serviceName?: string;
}

/**
 * DynamoDB construct following single table design patterns
 *
 * Features:
 * - Single table design with configurable GSIs
 * - Point-in-time recovery enabled
 * - Deletion protection for staging environment
 * - DynamoDB Streams support (configurable)
 * - Configuration-driven GSI setup
 */
class DbConstruct extends Construct {
  /**
   * The DynamoDB table instance
   */
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DbConstructProps) {
    super(scope, id);

    const { envName, serviceName = "deals-ms" } = props;

    // Get database configuration from config file
    const {
      gsis,
      settings: {
        enableStreams,
        pitrRetentionDays,
        useCustomerManagedEncryption,
      },
    } = databaseConfig;

    // Determine environment-specific defaults
    // Note: Using "staging" instead of "production" because production deployment
    // happens via manual approval in CodePipeline and doesn't re-synthesize CDK code
    const isStaging = envName === "staging";
    const shouldUseCMK = useCustomerManagedEncryption;
    const shouldProtectFromDeletion = isStaging;

    // Simplified approach: Use AWS defaults for encryption and logging
    // Add KMS/CloudWatch features via config when needed for production

    // Build Global Secondary Indexes from configuration
    // Only create GSIs if they are defined in the config
    const globalSecondaryIndexes = gsis.map((gsi: GSIConfig) => ({
      indexName: gsi.indexName,
      partitionKey: {
        name: gsi.partitionKey,
        type: AttributeType.STRING,
      },
      ...(gsi.sortKey && {
        sortKey: {
          name: gsi.sortKey,
          type: AttributeType.STRING,
        },
      }),
    }));

    // Create the DynamoDB table
    this.table = new TableV2(this, "Table", {
      // Naming and identification
      tableName: `${serviceName}-table-${envName}`,

      // Single table design schema
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      // Global Secondary Indexes (only if configured)
      ...(globalSecondaryIndexes.length > 0 && { globalSecondaryIndexes }),

      // Use default billing (pay-per-request) and encryption (AWS-owned keys)
      // Override via config/database.ts if needed

      // Data protection
      deletionProtection: shouldProtectFromDeletion,
      pointInTimeRecovery: true,

      // Streams (optional)
      ...(enableStreams && {
        dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES,
      }),

      // Resource management
      removalPolicy: isStaging ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Output table information
    new CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB table name",
      exportName: `${serviceName}-table-name-${envName}`,
    });

    new CfnOutput(this, "TableArn", {
      value: this.table.tableArn,
      description: "DynamoDB table ARN",
      exportName: `${serviceName}-table-arn-${envName}`,
    });
  }

  /**
   * Grant read permissions to a principal
   */
  public grantReadData(grantee: any): void {
    this.table.grantReadData(grantee);
  }

  /**
   * Grant write permissions to a principal
   */
  public grantWriteData(grantee: any): void {
    this.table.grantWriteData(grantee);
  }

  /**
   * Grant full permissions to a principal
   */
  public grantFullAccess(grantee: any): void {
    this.table.grantFullAccess(grantee);
  }
}

export default DbConstruct;

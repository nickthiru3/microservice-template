import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";

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
 */
class DbConstruct extends Construct {
  /**
   * The DynamoDB table instance
   */
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DbConstructProps) {
    super(scope, id);

    const { envName, serviceName = "deals-ms" } = props;

    // Determine environment-specific defaults
    // Note: Using "staging" instead of "production" because production deployment
    // happens via manual approval in CodePipeline and doesn't re-synthesize CDK code
    const isStaging = envName === "staging";
    const shouldProtectFromDeletion = isStaging;

    // Simplified approach: Use AWS defaults for encryption and logging
    // Add KMS/CloudWatch features when needed for production

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

      // Global Secondary Indexes
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

      // Use default billing (pay-per-request) and encryption (AWS-owned keys)

      // Data protection
      deletionProtection: shouldProtectFromDeletion,
      pointInTimeRecovery: true,

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
}

export default DbConstruct;

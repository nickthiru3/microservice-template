import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import type { IConfig } from "#config/default";

export interface IDatabaseConstructProps {
  readonly config: IConfig;
}

class DatabaseConstruct extends Construct {
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: IDatabaseConstructProps) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;
    const serviceName = config.service.name;

    // Protect data in non-dev/non-local; allow easy cleanup in dev/local
    const shouldProtectFromDeletion = envName !== "local" && envName !== "dev";

    this.table = new TableV2(this, "Table", {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

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
      deletionProtection: shouldProtectFromDeletion,
      pointInTimeRecovery: true,
      removalPolicy: shouldProtectFromDeletion
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
    });

    const tableName = this.table.tableName;
    const tableArn = this.table.tableArn;

    new CfnOutput(this, "TableName", {
      value: tableName,
      description: "DynamoDB table name",
      exportName: `${serviceName}-TableName`,
    });

    new CfnOutput(this, "TableArn", {
      value: tableArn,
      description: "DynamoDB table ARN",
      exportName: `${serviceName}-TableArn`,
    });
  }
}

export default DatabaseConstruct;

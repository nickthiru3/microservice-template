import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  TableV2,
  AttributeType,
  BillingMode,
  TableV2Props,
} from "aws-cdk-lib/aws-dynamodb";

interface DbStackProps extends StackProps {
  envName: string;
}

class DbStack extends Stack {
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    const { envName } = props;

    this.table = new TableV2(this, "TableV2", {
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
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}

export default DbStack;

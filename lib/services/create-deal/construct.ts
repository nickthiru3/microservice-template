const { Construct } = require("constructs");
const { NodejsFunction } = require("aws-cdk-lib/aws-lambda-nodejs");
const { Runtime } = require("aws-cdk-lib/aws-lambda");
// const { Duration } = require("aws-cdk-lib");
const { PolicyStatement, Effect } = require("aws-cdk-lib/aws-iam");
const path = require("path");

class CreateConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { db } = props;

    this.lambda = new NodejsFunction(this, "NodejsFunction", {
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
      runtime: Runtime.NODEJS_20_X,
      // memorySize: 1024,
      // memorySize: 512,
      // timeout: Duration.minutes(1),
      entry: path.join(
        __dirname,
        "../../../../../src/lambda/merchants/deals/create/handler.js"
      ),
      handler: "handler",
      depsLockFilePath: require.resolve("#package-lock"),
      environment: {
        TABLE_NAME: db.table.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [db.table.tableArn],
          actions: ["dynamodb:PutItem"],
        }),
      ],
    });
  }
}

module.exports = CreateConstruct;

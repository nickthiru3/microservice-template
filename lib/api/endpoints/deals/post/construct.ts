import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Model, RequestValidator } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import path from "path";

import schema from "./schema";

interface CreateDealConstructProps {
  readonly http: any;
  readonly dealsResource: any;
  readonly db: any;
}

class CreateDealConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CreateDealConstructProps) {
    super(scope, id);

    const { http, dealsResource, db } = props;

    const model = new Model(this, `Model`, {
      restApi: http.restApi,
      contentType: "application/json",
      description: "Validation model for create deals form",
      schema,
    });

    const requestValidator = new RequestValidator(this, `RequestValidator`, {
      restApi: http.restApi,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    const lambda = new NodejsFunction(this, "NodejsFunction", {
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
      runtime: Runtime.NODEJS_20_X,
      // memorySize: 1024,
      // memorySize: 512,
      // timeout: Duration.minutes(1),
      entry: path.join(__dirname, "#src/api/endpoints/create-deal/handler.ts"),
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

    dealsResource.addMethod("POST", new LambdaIntegration(lambda), {
      operationName: "CreateDeal",
      requestValidator,
      requestModels: {
        "application/json": model,
      },
      ...http.optionsWithAuth.writeDealsAuth, // Use write scope for deal creation
    });
  }
}

export default CreateDealConstruct;

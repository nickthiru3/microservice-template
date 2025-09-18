import { Construct } from "constructs";
import {
  LambdaIntegration,
  Model,
  RequestValidator,
  GatewayResponse,
  ResponseType,
  JsonSchema,
  IResource,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import path from "path";
import DatabaseConstruct from "#lib/db/construct";
import type { IApiProps } from "#lib/api/construct";
import schema from "./api.schema";

interface IPostConstructProps {
  readonly apiProps: IApiProps;
  readonly db: DatabaseConstruct;
  readonly dealsResource: IResource;
}

class PostConstruct extends Construct {
  dealModel: Model;
  requestValidator: RequestValidator;
  validationErrorResponse: GatewayResponse;
  lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: IPostConstructProps) {
    super(scope, id);

    const { apiProps, db, dealsResource } = props;

    this.createModelsForRequestValidation(apiProps, schema);
    this.createRequestValidator(apiProps);
    this.addCustomGatewayResponseForValidationErrors(apiProps);
    this.createLambdaFunction(db);
    this.addApiMethodWithLambdaIntegrationAndRequestValidation(
      apiProps,
      dealsResource
    );
  }

  createModelsForRequestValidation(apiProps: IApiProps, schema: JsonSchema) {
    this.dealModel = new Model(this, `DealModel`, {
      restApi: apiProps.restApi,
      contentType: "application/json",
      description: "Validation model for create deals form",
      schema,
    });
  }

  createRequestValidator(apiProps: IApiProps) {
    this.requestValidator = new RequestValidator(this, `RequestValidator`, {
      restApi: apiProps.restApi,
      validateRequestBody: true,
      validateRequestParameters: false,
    });
  }

  addCustomGatewayResponseForValidationErrors(apiProps: IApiProps) {
    const VALIDATION_ERROR_TEMPLATE = `{
        "error": "Validation error",
        "message": $context.error.messageString,
        "details": $context.error.validationErrorString,
        "stage": "$context.stage",
        "resourcePath": "$context.resourcePath"
      }`;

    this.validationErrorResponse = new GatewayResponse(
      this,
      "ValidationErrorResponse",
      {
        restApi: apiProps.restApi,
        type: ResponseType.BAD_REQUEST_BODY,
        statusCode: "400",
        responseHeaders: {
          "Access-Control-Allow-Origin": "'*'",
          "Access-Control-Allow-Headers": "'*'",
        },
        templates: {
          "application/json": VALIDATION_ERROR_TEMPLATE,
        },
      }
    );
  }

  createLambdaFunction(db: DatabaseConstruct) {
    this.lambda = new NodejsFunction(this, "NodejsFunction", {
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.minutes(1),
      entry: path.join(__dirname, "./handler.ts"),
      handler: "handler",
      depsLockFilePath: path.join(
        __dirname,
        "../../../../../package-lock.json"
      ),
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

  addApiMethodWithLambdaIntegrationAndRequestValidation(
    api: IApiProps,
    dealsResource: IResource
  ) {
    dealsResource.addMethod("POST", new LambdaIntegration(this.lambda), {
      operationName: "CreateDeal",
      requestValidator: this.requestValidator,
      requestModels: {
        "application/json": this.dealModel,
      },
      ...api.optionsWithAuth.deals.writeDealsAuth,
    });
  }
}

export default PostConstruct;

import { Construct } from "constructs";
import { RestApi, EndpointType, Cors } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";

import StageConstruct from "./stage/construct";
import EndpointsConstruct from "./endpoints/construct";
import AuthorizationConstruct from "./authorization/construct";
import PermissionsConstruct from "../permissions/construct";
import ServicesConstruct from "../services/construct";

interface ApiConstructProps {
  envName: string;
  userPool: IUserPool;
  permissions: PermissionsConstruct;
  services: ServicesConstruct;
}

/**
 * Stack for managing HTTP API Gateway
 * Handles API endpoints, authorization, and stages
 */
class ApiConstruct extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { envName, userPool, permissions, services } = props;

    /*** HTTP API ***/

    this.restApi = new RestApi(this, "RestApi", {
      description: "API Gateway for the application",
      endpointTypes: [EndpointType.REGIONAL],
      deploy: false, // Disable automatic stage creation i.e. prod
      // binaryMediaTypes: ["multipart/form-data"],
      cloudWatchRole: true,
    });

    // Stages
    new StageConstruct(this, `StageConstruct-${envName}`, {
      api: this.restApi,
      stageName: envName,
    });

    /*** Authorization ***/
    const authorization = new AuthorizationConstruct(this, "Authorization", {
      restApi: this.restApi,
      userPool,
      permissions,
    });

    /*** CORS ***/

    // Attach this to each root-level Resource
    const optionsWithCors = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    /*** Endpoints ***/

    new EndpointsConstruct(this, "EndpointsConstruct", {
      services,
      http: {
        restApi: this.restApi,
        optionsWithCors,
        optionsWithAuth: authorization.authOptions.deals,
      },
    });
  }
}

export default ApiConstruct;

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  RestApi,
  EndpointType,
  Cors,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
  MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";

import StageConstruct from "./stage/construct";
import EndpointsConstruct from "./endpoints/construct";
import AuthorizationConstruct from "./authorization/construct";
// import AuthStack from "../auth/construct";
import PermissionsStack from "../permissions/construct";
import ServicesStack from "../services/construct";

interface ApiConstructProps {
  envName: string;
  auth: AuthStack;
  permissions: PermissionsStack;
  services: ServicesStack;
}

/**
 * Stack for managing HTTP API Gateway
 * Handles API endpoints, authorization, and stages
 */
class ApiConstruct extends Construct {
  restApi: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id, props);

    const { envName, auth, permissions, services } = props;

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
      auth,
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

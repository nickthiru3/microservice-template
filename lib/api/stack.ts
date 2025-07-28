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

import StageStack from "./stage/stack";
import EndpointsStack from "./endpoints/stack";
import AuthorizationStack from "./authorization/stack";
import AuthStack from "../auth/stack";
import PermissionsStack from "../permissions/stack";
import ServicesStack from "../services/stack";

interface ApiStackProps extends cdk.StackProps {
  envName: string;
  auth: AuthStack;
  permissions: PermissionsStack;
  services: ServicesStack;
}

/**
 * Stack for managing HTTP API Gateway
 * Handles API endpoints, authorization, and stages
 */
class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
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
    new StageStack(this, `StageStack-${envName}`, {
      api: this.restApi,
      stageName: envName,
    });

    /*** Authorization ***/
    const authorization = new AuthorizationStack(this, "Authorization", {
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

    new EndpointsStack(this, "EndpointsStack", {
      services,
      http: {
        restApi: this.restApi,
        optionsWithCors,
        optionsWithAuth: authorization.authOptions.deals,
      },
    });
  }
}

export default ApiStack;

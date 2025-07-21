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

/**
 * @typedef {Object} HttpStackProps
 * @property {string} envName - Stage name (e.g., 'dev', 'prod')
 * @property {import('../../auth/stack').AuthStack} auth - Auth stack
 * @property {import('../../permissions/stack').PermissionsStack} permissions - Permissions stack
 * @property {import('../../services/stack').ServicesStack} services - Services stack
 */

/**
 * Stack for managing HTTP API Gateway
 * Handles API endpoints, authorization, and stages
 */
class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
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

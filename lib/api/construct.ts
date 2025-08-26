import { Construct } from "constructs";
import { RestApi, EndpointType, Cors } from "aws-cdk-lib/aws-apigateway";
import StageConstruct from "./stage/construct";
import AuthorizationConstruct from "./authorization/construct";
import EndpointsConstruct from "./endpoints/construct";
import PermissionsConstruct from "../permissions/construct";
import ServicesConstruct from "../services/construct";
import AuthBindingsConstruct from "../auth/construct";
import type { ApiProps, CorsOnlyResourceOptions } from "./types";

interface ApiConstructProps {
  envName: string;
  auth: AuthBindingsConstruct;
  permissions: PermissionsConstruct;
  services: ServicesConstruct;
}

/**
 * API Construct for managing HTTP API Gateway
 * Handles API endpoints, authorization, and stages
 */
class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { envName, auth, permissions, services } = props;

    /*** HTTP API ***/

    const restApi = new RestApi(this, "RestApi", {
      description: "API Gateway for the deals-ms microservice",
      endpointTypes: [EndpointType.REGIONAL],
      deploy: false, // Disable automatic stage creation i.e. prod
      cloudWatchRole: true,
    });

    // Stages
    new StageConstruct(this, `StageConstruct-${envName}`, {
      restApi,
      stageName: envName,
    });

    /*** Authorization ***/
    const authorization = new AuthorizationConstruct(this, "Authorization", {
      restApi,
      auth,
      permissions,
    });

    /*** CORS ***/

    // Attach this to each root-level Resource
    const optionsWithCors: CorsOnlyResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    /*** Endpoints ***/

    const apiProps: ApiProps = {
      restApi,
      optionsWithCors,
      optionsWithAuth: authorization.authOptions,
    };

    new EndpointsConstruct(this, "EndpointsConstruct", {
      services,
      api: apiProps,
    });
  }
}

export default ApiConstruct;

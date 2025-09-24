import { Construct } from "constructs";
import {
  RestApi,
  EndpointType,
  Cors,
  ResourceOptions,
} from "aws-cdk-lib/aws-apigateway";
import StageConstruct from "./stage/construct";
import AuthorizationConstruct from "./authorization/construct";
import EndpointsConstruct from "./endpoints/construct";
import PermissionsConstruct from "#lib/permissions/construct";
import BindingsConstruct from "#lib/bindings/construct";
import DatabaseConstruct from "#lib/db/construct";
import type { IConfig } from "#config/default";

interface IApiConstructProps {
  readonly config: IConfig;
  readonly bindings: BindingsConstruct;
  readonly permissions: PermissionsConstruct;
  readonly db: DatabaseConstruct;
}

// Shared API props shape passed down to endpoint constructs
type TCorsOnlyResourceOptions = Pick<
  ResourceOptions,
  "defaultCorsPreflightOptions"
>;

export interface IApiProps {
  readonly restApi: RestApi;
  readonly optionsWithCors: TCorsOnlyResourceOptions;
  // Full set of authorization options from AuthorizationConstruct
  readonly optionsWithAuth: AuthorizationConstruct["authOptions"];
}

class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IApiConstructProps) {
    super(scope, id);

    const { config, bindings, permissions, db } = props;

    const { envName } = config;
    const serviceName = config.service.name;

    /*** API ***/

    const restApi = new RestApi(this, "RestApi", {
      restApiName: `${serviceName}`,
      description: `API Gateway for ${serviceName}`,
      endpointTypes: [EndpointType.REGIONAL],
      deploy: false, // Disable automatic stage creation i.e. prod
      cloudWatchRole: true,
    });

    // Stages
    new StageConstruct(this, "StageConstruct", {
      restApi,
      config,
    });

    /*** Authorization ***/
    const authorization = new AuthorizationConstruct(this, "Authorization", {
      restApi,
      bindings,
      permissions,
    });

    /*** CORS ***/

    // Attach this to each root-level Resource
    const optionsWithCors: TCorsOnlyResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    /*** Endpoints ***/

    const apiProps: IApiProps = {
      restApi,
      optionsWithCors,
      optionsWithAuth: authorization.authOptions,
    };

    new EndpointsConstruct(this, "EndpointsConstruct", {
      config,
      apiProps,
      db,
    });
  }
}

export default ApiConstruct;

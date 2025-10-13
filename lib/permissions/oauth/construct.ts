import { Construct } from "constructs";
import ResourceServerConstruct from "../resource-server/construct";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";

interface IOAuthConstructProps {
  readonly resourceServer: ResourceServerConstruct;
}

export interface IAuthOptions {
  readonly authorizationType: AuthorizationType;
  readonly authorizer: { authorizerId: string };
  readonly authorizationScopes: string[];
}

export interface IResourceAuthOptions {
  readonly readResourceAuth: IAuthOptions;
  readonly writeResourceAuth: IAuthOptions;
  readonly deleteResourceAuth: IAuthOptions;
}

export interface IPermissionsProvider {
  readonly getAuthOptions: (authorizerId: string) => IResourceAuthOptions;
}

/**
 * Construct for managing OAuth permissions specific to the primary resource
 * Defines scopes for resource-related operations
 */
class OAuthConstruct extends Construct implements IPermissionsProvider {
  public readonly resourceServer: ResourceServerConstruct;

  constructor(scope: Construct, id: string, props: IOAuthConstructProps) {
    super(scope, id);

    const { resourceServer } = props;
    this.resourceServer = resourceServer;
  }

  getAuthOptions(authorizerId: string): IResourceAuthOptions {
    const slashScopes = this.resourceServer.getOAuthScopes();

    const baseAuth = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId },
    };

    return {
      readResourceAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/read")),
      },
      writeResourceAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/write")),
      },
      deleteResourceAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/delete")),
      },
    };
  }
}

export default OAuthConstruct;

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

export interface IDealsAuthOptions {
  readonly readDealsAuth: IAuthOptions;
  readonly writeDealsAuth: IAuthOptions;
  readonly deleteDealsAuth: IAuthOptions;
}

export interface IPermissionsProvider {
  readonly getAuthOptions: (authorizerId: string) => IDealsAuthOptions;
}

/**
 * Construct for managing OAuth permissions specific to deals
 * Defines scopes for deal-related operations
 */
class OAuthConstruct extends Construct implements IPermissionsProvider {
  public readonly resourceServer: ResourceServerConstruct;

  constructor(scope: Construct, id: string, props: IOAuthConstructProps) {
    super(scope, id);

    const { resourceServer } = props;
    this.resourceServer = resourceServer;
  }

  getAuthOptions(authorizerId: string): IDealsAuthOptions {
    const slashScopes = this.resourceServer.getOAuthScopes();

    const baseAuth = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId },
    };

    return {
      readDealsAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/read")),
      },
      writeDealsAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/write")),
      },
      deleteDealsAuth: {
        ...baseAuth,
        authorizationScopes: slashScopes.filter((s) => s.endsWith("/delete")),
      },
    };
  }
}

export default OAuthConstruct;

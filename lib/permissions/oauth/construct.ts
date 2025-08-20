import { Construct } from "constructs";
import ResourceServerConstruct from "../resource-server/construct";

interface OAuthConstructProps {
  readonly resourceServer: ResourceServerConstruct;
}

/**
 * Construct for managing OAuth permissions specific to deals
 * Defines scopes for deal-related operations
 */
class OAuthConstruct extends Construct {
  public readonly resourceServer: ResourceServerConstruct;

  constructor(scope: Construct, id: string, props: OAuthConstructProps) {
    super(scope, id);

    const { resourceServer } = props;
    this.resourceServer = resourceServer;
  }

  getAuthOptions(authorizerId: string) {
    const slashScopes = this.resourceServer.getOAuthScopes();
    const baseAuth = {
      authorizationType: "COGNITO_USER_POOLS",
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

  // Intentionally no extra helpers; routes spread specific auth objects from getAuthOptions
}

export default OAuthConstruct;

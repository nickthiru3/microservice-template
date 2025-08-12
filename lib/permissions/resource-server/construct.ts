import { Construct } from "constructs";
import {
  UserPoolResourceServer,
  ResourceServerScope,
  UserPool,
} from "aws-cdk-lib/aws-cognito";

interface ResourceServerConstructProps {
  readonly userPool: UserPool;
  readonly envName: string;
}

/**
 * Construct for managing the Deals Resource Server in Cognito
 * Handles scope definitions and resource server configuration
 */
class ResourceServerConstruct extends Construct {
  scopes: ResourceServerScope[];
  resourceServer: UserPoolResourceServer;

  constructor(
    scope: Construct,
    id: string,
    props: ResourceServerConstructProps
  ) {
    super(scope, id);

    const { userPool, envName } = props;

    // Define scopes for Deals API
    this.scopes = [
      new ResourceServerScope({
        scopeName: "read",
        scopeDescription: "Read access to deals",
      }),
      new ResourceServerScope({
        scopeName: "write",
        scopeDescription: "Write access to deals",
      }),
      new ResourceServerScope({
        scopeName: "delete",
        scopeDescription: "Delete access to deals",
      }),
    ];

    // Create Resource Server
    this.resourceServer = new UserPoolResourceServer(this, "ResourceServer", {
      userPool,
      identifier: `deals-${envName}`, // Include environment name in identifier
      scopes: this.scopes,
    });
  }

  /**
   * Get OAuth scopes for use in app client configuration
   * @returns {string[]} Array of OAuth scope strings
   */
  getOAuthScopes() {
    return this.scopes.map(
      (scope: ResourceServerScope) => `deals/${scope.scopeName}`
    );
  }
}

export default ResourceServerConstruct;

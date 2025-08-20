import { Construct } from "constructs";
import {
  UserPoolResourceServer,
  ResourceServerScope,
} from "aws-cdk-lib/aws-cognito";
import AuthConstruct from "#lib/auth/construct";

interface ResourceServerConstructProps {
  readonly auth: AuthConstruct;
  readonly envName: string;
}

/**
 * Construct for managing the Deals Resource Server in Cognito
 * Handles scope definitions and resource server configuration
 */
class ResourceServerConstruct extends Construct {
  scopes: ResourceServerScope[];
  resourceServer: UserPoolResourceServer;
  identifier: string;

  constructor(
    scope: Construct,
    id: string,
    props: ResourceServerConstructProps
  ) {
    super(scope, id);

    const { auth, envName } = props;

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
    this.resourceServer = new UserPoolResourceServer(
      this,
      "UserPoolResourceServer",
      {
        userPool: auth.userPool,
        identifier: `deals-${envName}`, // Include environment name in identifier
        scopes: this.scopes,
      }
    );
    this.identifier = this.resourceServer.userPoolResourceServerId;
  }

  getOAuthScopes(): string[] {
    return this.scopes.map(
      (scope: ResourceServerScope) => `${this.identifier}/${scope.scopeName}`
    );
  }
}

export default ResourceServerConstruct;

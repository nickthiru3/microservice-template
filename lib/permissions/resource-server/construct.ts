import { Construct } from "constructs";
import {
  UserPoolResourceServer,
  ResourceServerScope,
} from "aws-cdk-lib/aws-cognito";
import AuthConstruct from "#lib/auth/construct";
import type { IConfig } from "#config/default";

interface IResourceServerConstructProps {
  readonly auth: AuthConstruct;
  readonly config: IConfig;
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
    props: IResourceServerConstructProps
  ) {
    super(scope, id);

    const { auth, config } = props;

    const serviceName = config.service.name;

    this.scopes = [
      new ResourceServerScope({
        scopeName: "read",
        scopeDescription: `${serviceName}: Read access`,
      }),
      new ResourceServerScope({
        scopeName: "write",
        scopeDescription: `${serviceName}: Write access`,
      }),
      new ResourceServerScope({
        scopeName: "delete",
        scopeDescription: `${serviceName}: Delete access`,
      }),
    ];

    this.resourceServer = new UserPoolResourceServer(
      this,
      "UserPoolResourceServer",
      {
        userPool: auth.userPool,
        identifier: serviceName,
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

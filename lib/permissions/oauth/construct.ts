import { Construct } from "constructs";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";
import * as cdk from "aws-cdk-lib";

interface OAuthConstructProps {
  readonly resourceServer: cdk.aws_cognito.IUserPoolResourceServer;
}

/**
 * Construct for managing OAuth permissions specific to deals
 * Defines scopes for deal-related operations
 */
class OAuthConstruct extends Construct {
  public readonly resourceServer: cdk.aws_cognito.IUserPoolResourceServer;
  public readonly scopes: {
    scopeName: string;
    scopeDescription: string;
  }[];

  constructor(scope: Construct, id: string, props: OAuthConstructProps) {
    super(scope, id);

    const { resourceServer } = props;

    // Store reference to resource server
    this.resourceServer = resourceServer;

    // Define scopes
    this.scopes = [
      {
        scopeName: "deals:read",
        scopeDescription: "Read access to deals",
      },
      {
        scopeName: "deals:write",
        scopeDescription: "Write access to deals",
      },
      {
        scopeName: "deals:delete",
        scopeDescription: "Delete access to deals",
      },
    ];
  }

  /**
   * Get OAuth scopes for use in app client configuration
   * @returns {import('aws-cdk-lib/aws-cognito').OAuthScope[]} Array of OAuth scopes
   */
  getOAuthScopes() {
    return this.scopes.map((scope) =>
      OAuthScope.resourceServer(this.resourceServer, scope.scopeName)
    );
  }

  /**
   * Get all scope names
   * @returns {string[]} Array of scope names
   */
  getScopeNames() {
    return this.scopes.map((scope) => scope.scopeName);
  }

  /**
   * Get authorization options for API Gateway
   * @param {string} authorizerId - ID of the Cognito authorizer
   * @returns {Object} Authorization options for different deal operations
   */
  getAuthOptions(authorizerId) {
    const scopeNames = this.getScopeNames();
    const baseAuth = {
      authorizationType: "COGNITO_USER_POOLS",
      authorizer: { authorizerId },
    };

    return {
      readDealsAuth: {
        ...baseAuth,
        authorizationScopes: [
          scopeNames.find((scope) => scope === "deals:read"),
        ],
      },
      writeDealsAuth: {
        ...baseAuth,
        authorizationScopes: [
          scopeNames.find((scope) => scope === "deals:write"),
        ],
      },
      deleteDealsAuth: {
        ...baseAuth,
        authorizationScopes: [
          scopeNames.find((scope) => scope === "deals:delete"),
        ],
      },
    };
  }

  /**
   * Get authorization options for a specific operation
   * @param {string} authorizerId - ID of the Cognito authorizer
   * @param {'read' | 'write' | 'delete'} operation - The operation to get auth options for
   * @returns {Object} Authorization options for the specified operation
   */
  getAuthForOperation(authorizerId, operation) {
    const options = this.getAuthOptions(authorizerId);
    switch (operation) {
      case "read":
        return options.readDealsAuth;
      case "write":
        return options.writeDealsAuth;
      case "delete":
        return options.deleteDealsAuth;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

export default OAuthConstruct;

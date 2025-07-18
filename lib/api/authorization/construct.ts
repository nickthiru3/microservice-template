import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";

/**
 * @typedef {Object} AuthorizationConstructProps
 * @property {import('aws-cdk-lib/aws-apigateway').RestApi} restApi - API Gateway REST API
 * @property {import('../../../auth/stack').AuthStack} auth - Auth stack
 * @property {import('../../../permissions/stack').PermissionsStack} permissions - Permissions stack
 */

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { restApi, auth, permissions } = props;

    // Create and attach Cognito authorizer
    this.authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "CognitoUserPoolsAuthorizer",
      {
        cognitoUserPools: [auth.userPool.pool],
        identitySource: "method.request.header.Authorization",
      }
    );
    this.authorizer._attachToApi(restApi);

    // Get authorization options for different services
    this.authOptions = {
      deals: permissions.oauth.deals.getAuthOptions(
        this.authorizer.authorizerId
      ),
      // Add more service auth options here as needed
    };
  }
}

export default AuthorizationConstruct;

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { RestApi } from "aws-cdk-lib/aws-apigateway";

interface AuthorizationConstructProps {
  readonly restApi: RestApi;
  readonly auth: UserPool;
  readonly permissions: AuthorizationType;
}

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  authorizer: CognitoUserPoolsAuthorizer;
  authOptions: {
    deals: AuthorizationType;
  };

  constructor(
    scope: Construct,
    id: string,
    props: AuthorizationConstructProps
  ) {
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

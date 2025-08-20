import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import PermissionsConstruct from "../../permissions/construct";

interface AuthorizationConstructProps {
  readonly restApi: RestApi;
  readonly userPool: IUserPool;
  readonly permissions: PermissionsConstruct;
}

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  authorizer: CognitoUserPoolsAuthorizer;
  authOptions: {
    deals: {
      readDealsAuth: { authorizationType: string; authorizer: { authorizerId: string }; authorizationScopes: string[] };
      writeDealsAuth: { authorizationType: string; authorizer: { authorizerId: string }; authorizationScopes: string[] };
      deleteDealsAuth: { authorizationType: string; authorizer: { authorizerId: string }; authorizationScopes: string[] };
    };
  };

  constructor(
    scope: Construct,
    id: string,
    props: AuthorizationConstructProps
  ) {
    super(scope, id);

    const { restApi, userPool, permissions } = props;

    // Create and attach Cognito authorizer
    this.authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "CognitoUserPoolsAuthorizer",
      {
        cognitoUserPools: [userPool],
        identitySource: "method.request.header.Authorization",
      }
    );
    this.authorizer._attachToApi(restApi);

    // Get authorization options for different services
    this.authOptions = {
      deals: permissions.oauth.getAuthOptions(this.authorizer.authorizerId),
      // Add more service auth options here as needed
    };
  }
}

export default AuthorizationConstruct;

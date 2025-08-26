import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { RestApi, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import PermissionsConstruct from "../../permissions/construct";
import AuthBindingsConstruct from "../../auth/construct";

interface AuthOptions {
  authorizationType: AuthorizationType;
  authorizer: { authorizerId: string };
  authorizationScopes: string[];
}

interface DealsAuthOptions {
  readDealsAuth: AuthOptions;
  writeDealsAuth: AuthOptions;
  deleteDealsAuth: AuthOptions;
}

interface AuthorizationConstructProps {
  readonly restApi: RestApi;
  readonly auth: AuthBindingsConstruct;
  readonly permissions: PermissionsConstruct;
}

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  authorizer: CognitoUserPoolsAuthorizer;
  authOptions: {
    deals: DealsAuthOptions;
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
        cognitoUserPools: [auth.userPool],
        identitySource: "method.request.header.Authorization",
      }
    );
    this.authorizer._attachToApi(restApi);

    // Get authorization options for different services
    this.authOptions = {
      deals: permissions.oauth.getAuthOptions(
        this.authorizer.authorizerId
      ) as DealsAuthOptions,
      // Add more service auth options here as needed
    };
  }
}

export default AuthorizationConstruct;

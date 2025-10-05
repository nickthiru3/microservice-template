import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { RestApi, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import PermissionsConstruct from "#lib/permissions/construct";
import SsmBindingsConstruct from "#lib/ssm-bindings/construct.js";

interface IAuthOptions {
  readonly authorizationType: AuthorizationType;
  readonly authorizer: { authorizerId: string };
  readonly authorizationScopes: string[];
}

interface IDealsAuthOptions {
  readonly readDealsAuth: IAuthOptions;
  readonly writeDealsAuth: IAuthOptions;
  readonly deleteDealsAuth: IAuthOptions;
}

interface IAuthorizationConstructProps {
  readonly restApi: RestApi;
  readonly ssmBindings: SsmBindingsConstruct;
  readonly permissions: PermissionsConstruct;
}

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  authorizer: CognitoUserPoolsAuthorizer;
  authOptions: {
    deals: IDealsAuthOptions;
  };

  constructor(
    scope: Construct,
    id: string,
    props: IAuthorizationConstructProps
  ) {
    super(scope, id);

    const { restApi, ssmBindings, permissions } = props;

    // Create and attach Cognito authorizer
    this.authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "CognitoUserPoolsAuthorizer",
      {
        cognitoUserPools: [ssmBindings.auth.userPool],
        identitySource: "method.request.header.Authorization",
      }
    );
    this.authorizer._attachToApi(restApi);

    // Get authorization options for different services
    this.authOptions = {
      deals: permissions.oauth.getAuthOptions(
        this.authorizer.authorizerId
      ) as IDealsAuthOptions,
      // Add more service auth options here as needed
    };
  }
}

export default AuthorizationConstruct;

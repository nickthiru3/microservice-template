import { Construct } from "constructs";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { RestApi, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import type {
  IPermissionsProvider,
  IResourceAuthOptions,
} from "#lib/permissions/construct";
import SsmBindingsConstruct from "#lib/ssm-bindings/construct";

interface IAuthOptions {
  readonly authorizationType: AuthorizationType;
  readonly authorizer: { authorizerId: string };
  readonly authorizationScopes: string[];
}

interface IAuthorizationConstructProps {
  readonly restApi: RestApi;
  readonly ssmBindings: SsmBindingsConstruct;
  readonly permissions: IPermissionsProvider;
}

/**
 * Construct for managing API Gateway authorization
 * Handles Cognito authorizer and OAuth scope-based permissions
 */
class AuthorizationConstruct extends Construct {
  authorizer: CognitoUserPoolsAuthorizer;
  authOptions: {
    primaryResource: IResourceAuthOptions;
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
      primaryResource: permissions.oauth.getAuthOptions(
        this.authorizer.authorizerId
      ),
      // Add more resource auth options here as needed
    };
  }
}

export default AuthorizationConstruct;

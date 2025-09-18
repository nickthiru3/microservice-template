import { Construct } from "constructs";
import ResourceServerConstruct from "./resource-server/construct";
import OAuthConstruct from "./oauth/construct";
import PoliciesConstruct from "./policies/construct";
import IamConstruct from "#lib/iam/construct";
import StorageConstruct from "#lib/storage/construct";
import AuthConstruct from "#lib/auth/construct";
import type { IConfig } from "#config/default";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";

export interface IAuthOptions {
  readonly authorizationType: AuthorizationType;
  readonly authorizer: { authorizerId: string };
  readonly authorizationScopes: string[];
}

export interface IUsersAuthOptions {
  readonly readUsersAuth: IAuthOptions;
  readonly writeUsersAuth: IAuthOptions;
  readonly deleteUsersAuth: IAuthOptions;
}

export interface IPermissionsProvider {
  readonly oauth: {
    getAuthOptions(authorizerId: string): IUsersAuthOptions;
  };
}

interface IPermissionsConstructProps {
  readonly config: IConfig;
  readonly iam: IamConstruct;
  readonly storage: StorageConstruct;
  readonly auth: AuthConstruct;
}

/**
 * Stack for managing identity-based permissions
 * Handles attaching policies to roles for accessing various resources
 */
class PermissionsConstruct extends Construct {
  readonly oauth: OAuthConstruct;

  constructor(scope: Construct, id: string, props: IPermissionsConstructProps) {
    super(scope, id);

    const { config, iam, auth, storage } = props;

    const resourceServer = new ResourceServerConstruct(
      this,
      "ResourceServerConstruct",
      {
        auth,
        config,
      }
    );

    // OAuth permissions integrated with existing UserPool Resource Server wrapper
    this.oauth = new OAuthConstruct(this, "OAuthConstruct", {
      resourceServer,
    });

    new PoliciesConstruct(this, "PoliciesConstruct", {
      config,
      iam,
      storage,
    });
  }
}

export default PermissionsConstruct;

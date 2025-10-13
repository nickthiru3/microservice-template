import { Construct } from "constructs";
import ResourceServerConstruct from "./resource-server/construct";
import OAuthConstruct from "./oauth/construct";
import PoliciesConstruct from "./policies/construct";
import StorageConstruct from "#lib/storage/construct";
import SsmBindingsConstruct from "#lib/ssm-bindings/construct";
import type { IConfig } from "#config/default";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";

export interface IAuthOptions {
  readonly authorizationType: AuthorizationType;
  readonly authorizer: { authorizerId: string };
  readonly authorizationScopes: string[];
}

export interface IResourceAuthOptions {
  readonly readResourceAuth: IAuthOptions;
  readonly writeResourceAuth: IAuthOptions;
  readonly deleteResourceAuth: IAuthOptions;
}

export interface IPermissionsProvider {
  readonly oauth: {
    getAuthOptions(authorizerId: string): IResourceAuthOptions;
  };
}

interface IPermissionsConstructProps {
  readonly config: IConfig;
  readonly storage: StorageConstruct;
  readonly ssmBindings: SsmBindingsConstruct;
}

/**
 * Stack for managing identity-based permissions
 * Handles attaching policies to roles for accessing various resources
 */
class PermissionsConstruct extends Construct implements IPermissionsProvider {
  readonly oauth: {
    getAuthOptions(authorizerId: string): IResourceAuthOptions;
  };

  constructor(scope: Construct, id: string, props: IPermissionsConstructProps) {
    super(scope, id);

    const { config, ssmBindings, storage } = props;

    const resourceServer = new ResourceServerConstruct(
      this,
      "ResourceServerConstruct",
      {
        ssmBindings,
        config,
      }
    );

    // OAuth permissions integrated with existing UserPool Resource Server wrapper
    const oauthConstruct = new OAuthConstruct(this, "OAuthConstruct", {
      resourceServer,
    });

    this.oauth = {
      getAuthOptions: (authorizerId: string): IResourceAuthOptions =>
        oauthConstruct.getAuthOptions(authorizerId),
    };

    new PoliciesConstruct(this, "PoliciesConstruct", {
      config,
      ssmBindings,
      storage,
    });
  }
}

export default PermissionsConstruct;

export class NoopPermissionsConstruct implements IPermissionsProvider {
  readonly oauth = {
    getAuthOptions: (authorizerId: string): IResourceAuthOptions => {
      const base: IAuthOptions = {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId },
        authorizationScopes: [],
      };

      return {
        readResourceAuth: { ...base },
        writeResourceAuth: { ...base },
        deleteResourceAuth: { ...base },
      };
    },
  };
}

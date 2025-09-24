import { Construct } from "constructs";
import { IUserPool, UserPool } from "aws-cdk-lib/aws-cognito";
import BindingsUtilConstruct from "#lib/utils/bindings/construct";
import type { IAuthBindings } from "@super-deals/infra-contracts";
import type { IConfig } from "#config/default";

interface IAuthBindingsConstructProps {
  readonly config: IConfig;
}

class AuthBindingsConstruct extends Construct {
  public readonly userPool: IUserPool;

  constructor(
    scope: Construct,
    id: string,
    props: IAuthBindingsConstructProps
  ) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;
    // Must match the service name used by the producer when publishing to SSM
    // Users service currently publishes under '/super-deals/<env>/Users/public/...'
    const producerServiceName = "Users";

    const spec = {
      userPoolId: "auth/userPoolId",
    } as const;

    const bindings = new BindingsUtilConstruct<IAuthBindings>(
      this,
      "UsersMsAuthBindings",
      {
        envName,
        producerServiceName,
        visibility: "public",
        spec,
      }
    );

    this.userPool = UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      bindings.values.userPoolId
    );
  }
}

export default AuthBindingsConstruct;

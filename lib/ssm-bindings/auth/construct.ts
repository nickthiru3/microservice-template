import { Construct } from "constructs";
import { IUserPool, UserPool } from "aws-cdk-lib/aws-cognito";
import SsmBindingsUtilConstruct from "#lib/utils/ssm-bindings/construct";
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
    const producerServiceName = "users";

    const params = {
      userPoolId: "auth/userPoolId",
    } as const;

    const bindings = new SsmBindingsUtilConstruct<IAuthBindings>(
      this,
      "AuthBindings",
      {
        envName,
        producerServiceName,
        params,
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

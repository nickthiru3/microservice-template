import { Construct } from "constructs";
import { IUserPool, UserPool } from "aws-cdk-lib/aws-cognito";
import { z } from "zod";
import type { AuthBindings } from "@super-deals/infra-contracts";
import { getBasePath, readParamRequired } from "#src/helpers/ssm/_index";
import { Aws } from "aws-cdk-lib";

interface AuthBindingsConstructProps {
  readonly envName: string;
}

class AuthBindingsConstruct extends Construct {
  public readonly userPool: IUserPool;

  constructor(scope: Construct, id: string, props: AuthBindingsConstructProps) {
    super(scope, id);

    const { envName } = props;

    const basePath = getBasePath(envName);
    const userPoolId = readParamRequired(this, `${basePath}/auth/userPoolId`);

    // Validate required inputs and compute derived fields
    const AuthBindingsSchema = z.object({
      userPoolId: z.string().min(1, "userPoolId missing"),
    });
    const base = AuthBindingsSchema.parse({ userPoolId });
    const issuerUrl = `https://cognito-idp.${Aws.REGION}.amazonaws.com/${base.userPoolId}`;
    const jwksUri = `${issuerUrl}/.well-known/jwks.json`;
    const bindings: AuthBindings = { ...base, issuerUrl, jwksUri };

    this.userPool = UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      bindings.userPoolId
    );
  }
}

export default AuthBindingsConstruct;

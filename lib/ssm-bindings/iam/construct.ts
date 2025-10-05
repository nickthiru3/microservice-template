import { Construct } from "constructs";
import { Role, IRole } from "aws-cdk-lib/aws-iam";
import SsmBindingsUtilConstruct from "#lib/utils/ssm-bindings/construct";
import type { IIamBindings } from "@super-deals/infra-contracts";
import type { IConfig } from "#config/default";

interface IIamBindingsConstructProps {
  readonly config: IConfig;
}

class IamBindingsConstruct extends Construct {
  public readonly roles: {
    merchant: IRole;
  };

  constructor(scope: Construct, id: string, props: IIamBindingsConstructProps) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;
    const producerServiceName = "users";

    const params = {
      merchantRoleArn: "iam/roles/merchant/arn",
    } as const;

    const bindings = new SsmBindingsUtilConstruct<IIamBindings>(
      this,
      "IamBindings",
      {
        envName,
        producerServiceName,
        params,
      }
    );

    this.roles = {
      merchant: Role.fromRoleArn(
        this,
        "ImportedMerchantRole",
        bindings.values.merchantRoleArn
      ),
    };
  }
}

export default IamBindingsConstruct;

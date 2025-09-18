import { Construct } from "constructs";
import { Role, IRole } from "aws-cdk-lib/aws-iam";
import BindingsConstruct from "#lib/utils/bindings/construct";
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
    // Must match the service name used by the producer when publishing to SSM
    // Users service currently publishes under '/super-deals/<env>/Users/public/...'
    const producerServiceName = "Users";

    // Read from users-ms public path using ergonomic spec mapping
    const spec = {
      merchantRoleArn: "iam/roles/merchant/arn",
    } as const;

    const bindings = new BindingsConstruct<IIamBindings>(
      this,
      "UsersMsIamBindings",
      {
        envName,
        producerServiceName,
        visibility: "public",
        spec,
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

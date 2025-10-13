import { Construct } from "constructs";
import { Secret, SecretStringGenerator } from "aws-cdk-lib/aws-secretsmanager";
import type { IConfig } from "#config/default";

interface ISecretsConstructProps {
  readonly config: IConfig;
  readonly secretName?: string;
  readonly secretGenerator?: SecretStringGenerator;
}

class SecretsConstruct extends Construct {
  readonly secret: Secret;

  constructor(scope: Construct, id: string, props: ISecretsConstructProps) {
    super(scope, id);

    const { config, secretName, secretGenerator } = props;

    this.secret = new Secret(this, "ServiceSecret", {
      secretName: secretName ?? `${config.service.name}/default`,
      generateSecretString: secretGenerator ?? {
        passwordLength: 32,
        excludePunctuation: true,
      },
    });
  }
}

export default SecretsConstruct;

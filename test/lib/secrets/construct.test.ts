import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import SecretsConstruct from "#lib/secrets/construct";
import type { IConfig } from "#config/default";

describe("SecretsConstruct", () => {
  it("creates a default secret with service-based name", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");

    const config = {
      envName: "dev",
      accountId: "123456789012",
      region: "us-east-1",
      service: { name: "resource", displayName: "Resource" },
      resources: {
        tablePrefix: "resource",
        bucketPrefix: "resource",
        functionPrefix: "resource",
        apiPrefix: "resource",
      },
    } as unknown as IConfig;

    new SecretsConstruct(stack, "SecretsConstruct", { config });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike({
      Name: "resource/default",
    }));
  });

  it("allows overriding secret name and generator", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");

    const config = {
      envName: "dev",
      accountId: "123456789012",
      region: "us-east-1",
      service: { name: "resource", displayName: "Resource" },
      resources: {
        tablePrefix: "resource",
        bucketPrefix: "resource",
        functionPrefix: "resource",
        apiPrefix: "resource",
      },
    } as unknown as IConfig;

    new SecretsConstruct(stack, "SecretsConstruct", {
      config,
      secretName: "resource/apiKey",
      secretGenerator: {
        passwordLength: 40,
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike({
      Name: "resource/apiKey",
      GenerateSecretString: Match.objectLike({
        PasswordLength: 40,
      }),
    }));
  });
});

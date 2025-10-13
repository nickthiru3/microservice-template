import {
  buildSsmPublicPath,
  buildSsmPrivatePath,
  readParam,
  publishStringParameters,
  publishSecureStringParameters,
  readBindings,
  readSecureParam,
  readSecureBindings,
} from "#src/helpers/ssm";
import config from "#config/default";

// Mock aws-cdk-lib SecretValue and aws-ssm helpers so we don't require real CDK constructs
jest.mock("aws-cdk-lib", () => ({
  SecretValue: {
    ssmSecure: jest.fn((name: string) => ({
      unsafeUnwrap: () => `SECURE_VALUE_FOR:${name}`,
    })),
  },
}));

jest.mock("aws-cdk-lib/aws-ssm", () => {
  const instances: any[] = [];

  const StringParameter = jest.fn().mockImplementation(
    (_scope: unknown, _id: string, props: Record<string, unknown>) => {
      const cfnParameter = {
        keyId: undefined as string | undefined,
        addPropertyOverride: jest.fn((prop: string, value: any) => {
          if (prop === "KeyId") {
            cfnParameter.keyId = value;
          }
        }),
      };
      const instance = {
        scope: _scope,
        id: _id,
        props,
        node: { defaultChild: cfnParameter },
      };
      instances.push(instance);
      return instance;
    }
  );

  Object.assign(StringParameter, {
    instances,
    fromStringParameterName: jest.fn(
      (_scope: unknown, _id: string, name: string) => ({
        stringValue: `VALUE_FOR:${name}`,
      })
    ),
  });

  return {
    __esModule: true,
    ParameterTier: { STANDARD: "STANDARD" },
    StringParameter,
  };
});

describe("src/helpers/ssm", () => {
  // Minimal fake scope; not used thanks to the mock
  const scope: any = {};
  const { StringParameter } = jest.requireMock("aws-cdk-lib/aws-ssm") as {
    StringParameter: jest.Mock & {
      instances: Array<{
        scope: unknown;
        id: string;
        props: Record<string, unknown>;
        node: { defaultChild: { keyId?: string } };
      }>;
    };
  };

  beforeEach(() => {
    StringParameter.mockClear();
    StringParameter.instances.length = 0;
  });

  const appBasePath = config.parameterStorePrefix || "{{APP_BASE_PATH}}";
  const defaultServiceName = config.service.name || "{{SERVICE_NAME}}";

  const normalize = (value: string) => value.replace(/\/{2,}/g, "/");

  test("buildSsm*Path constructs normalized paths", () => {
    const pub = buildSsmPublicPath("dev", defaultServiceName);
    const priv = buildSsmPrivatePath("dev", defaultServiceName);

    expect(normalize(pub)).toBe(
      normalize(`${appBasePath}/dev/${defaultServiceName}/public`)
    );
    expect(normalize(priv)).toBe(
      normalize(`${appBasePath}/dev/${defaultServiceName}/private`)
    );
  });

  test("readParam returns mocked stringValue for given name", () => {
    const parameterName = normalize(
      `${appBasePath}/dev/${defaultServiceName}/public/ApiUrl`
    );
    const val = readParam(scope, parameterName);
    expect(val).toBe(`VALUE_FOR:${parameterName}`);
  });

  test("readBindings maps params to hierarchical suffixes under base path", () => {
    const base = normalize(
      `${appBasePath}/dev/${defaultServiceName}/private`
    );
    const out = readBindings(scope, base, {
      resourceTableName: "Db/TableName",
      auditLogEventBusArn: "Events/Buses/AuditLog/Arn",
    });
    expect(out).toEqual({
      resourceTableName: `VALUE_FOR:${normalize(
        `${base}/Db/TableName`
      )}`,
      auditLogEventBusArn: `VALUE_FOR:${normalize(
        `${base}/Events/Buses/AuditLog/Arn`
      )}`,
    });
  });

  test("publishStringParameters creates parameters for each k/v (smoke)", () => {
    // We don't assert CDK constructs; just ensure no throw
    expect(() =>
      publishStringParameters(scope, "/base", { A: "1", B: "2" })
    ).not.toThrow();
    expect(StringParameter).toHaveBeenCalledTimes(2);
  });

  test("publishSecureStringParameters writes secure strings and applies encryption key", () => {
    publishSecureStringParameters(
      scope,
      "/secure",
      { secretToken: "xyz" },
      { encryptionKeyArn: "arn:aws:kms:region:acct:key/id" }
    );

    expect(StringParameter).toHaveBeenCalledWith(
      scope,
      "SecureParam_secretToken",
      expect.objectContaining({
        parameterName: "/secure/secretToken",
        stringValue: "xyz",
        tier: "STANDARD",
      })
    );

    // Verify addPropertyOverride was called to set SecureString type
    const cfnParameter = StringParameter.instances[0].node.defaultChild as any;
    expect(cfnParameter.addPropertyOverride).toHaveBeenCalledWith("Type", "SecureString");
    expect(cfnParameter.addPropertyOverride).toHaveBeenCalledWith("KeyId", "arn:aws:kms:region:acct:key/id");
    
    // Verify the keyId was set
    expect(cfnParameter.keyId).toBe("arn:aws:kms:region:acct:key/id");
  });

  test("readSecureParam returns mocked secure value", () => {
    const parameterName = normalize(
      `${appBasePath}/dev/platform/private/monitor/slack/webhookUrl`
    );
    const val = readSecureParam(scope, parameterName);
    expect(val).toBe(`SECURE_VALUE_FOR:${parameterName}`);
  });

  test("readSecureBindings maps params to secure reads under base path", () => {
    const base = normalize(`${appBasePath}/dev/platform/private`);
    const out = readSecureBindings(scope, base, {
      slackWebhookUrl: "monitor/slack/webhookUrl",
      incidentWebhookUrl: "monitor/slack/incidentWebhookUrl",
    });
    expect(out).toEqual({
      slackWebhookUrl: `SECURE_VALUE_FOR:${normalize(
        `${base}/monitor/slack/webhookUrl`
      )}`,
      incidentWebhookUrl: `SECURE_VALUE_FOR:${normalize(
        `${base}/monitor/slack/incidentWebhookUrl`
      )}`,
    });
  });
});

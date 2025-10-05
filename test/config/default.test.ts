const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ENV_NAME;
  delete process.env.SERVICE_NAME;
  delete process.env.SERVICE_DISPLAY_NAME;
  delete process.env.AWS_ACCOUNT_ID;
  delete process.env.AWS_REGION;
  delete process.env.AWS_DEFAULT_REGION;
  delete process.env.CDK_DEFAULT_ACCOUNT;
  delete process.env.CDK_DEFAULT_REGION;
  delete process.env.GITHUB_REPO;
  delete process.env.GITHUB_BRANCH;
  delete process.env.CODESTAR_CONNECTION_ID;
  delete process.env.APP_BASE_PATH;
}

describe("config/default", () => {
  beforeEach(() => {
    jest.resetModules();
    resetEnv();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadConfig() {
    return require("#config/default").default as any;
  }

  test("returns local defaults when ENV_NAME is local", () => {
    process.env.ENV_NAME = "local";
    process.env.SERVICE_NAME = "deals-ms";

    const config = loadConfig();

    expect(config.envName).toBe("local");
    expect(config.accountId).toBe("000000000000");
    expect(config.region).toBe("us-east-1");
    expect(config.github).toBeUndefined();
  });

  test("uses CODESTAR_CONNECTION_ID env override for non-local", () => {
    process.env.ENV_NAME = "staging";
    process.env.SERVICE_NAME = "deals-ms";
    process.env.AWS_ACCOUNT_ID = "123456789012";
    process.env.AWS_REGION = "us-east-1";
    process.env.GITHUB_REPO = "nickthiru/super-deals";
    process.env.CODESTAR_CONNECTION_ID = "env-connection";

    const config = loadConfig();

    expect(config.envName).toBe("staging");
    expect(config.github?.codestarConnectionId).toBe("env-connection");
    expect(config.github?.repo).toBe("nickthiru/super-deals");
  });

  test("falls back to SSM dynamic reference when CODestar env is missing", () => {
    process.env.ENV_NAME = "production";
    process.env.SERVICE_NAME = "deals-ms";
    process.env.AWS_ACCOUNT_ID = "123456789012";
    process.env.AWS_REGION = "us-east-1";
    process.env.GITHUB_REPO = "nickthiru/super-deals";

    const config = loadConfig();

    expect(config.github?.codestarConnectionId).toMatch(
      /\{\{resolve:ssm:\/platform\/production\/github\/codestar-connection-id\}\}/
    );
  });

  test("respects APP_BASE_PATH for parameterStorePrefix", () => {
    process.env.ENV_NAME = "local";
    process.env.SERVICE_NAME = "deals-ms";
    process.env.APP_BASE_PATH = "/custom/base";

    const config = loadConfig();

    expect(config.parameterStorePrefix).toBe("/custom/base");
  });

  test("throws when AWS account ID missing in non-local env", () => {
    process.env.ENV_NAME = "staging";
    process.env.SERVICE_NAME = "deals-ms";
    process.env.AWS_REGION = "us-east-1";
    process.env.GITHUB_REPO = "nickthiru/super-deals";

    expect(() => loadConfig()).toThrow(/AWS account ID is required/);
  });
});

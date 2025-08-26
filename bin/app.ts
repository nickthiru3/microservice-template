// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config();

// Now load other modules
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { CicdStack } from "#lib/cicd-stack";
import { ServiceStack } from "#lib/service-stack";
import appConfig, { type Config } from "#config/default";
import { makeEnv, makeTags, makeDescription } from "#src/helpers/config";

// Debug: Check if environment variables are loaded
console.log("🔍 Debug: Environment variables during synthesis:");
console.log("ENV_NAME:", process.env.ENV_NAME);
console.log("CODESTAR_CONNECTION_ID:", process.env.CODESTAR_CONNECTION_ID);
console.log("CDK_DEFAULT_ACCOUNT:", process.env.CDK_DEFAULT_ACCOUNT);

// Load environment configuration
const app = new App();
const config: Config = appConfig;
const envName = config.envName || "local";

// Helpers moved to src/helpers/config

// Conditional stack deployment based on environment
// Note: We pass `env: makeEnv(envName, config)` to each Stack so CDK binds the
// stack to a specific account/region (bootstrap/assets/lookups). Internally,
// stacks read account/region/envName from `config` as the single source of truth.
const targetEnv = makeEnv(envName, config);
if (envName === "local") {
  // LocalStack: Deploy only service infrastructure (no pipeline)
  console.log("🏠 Deploying service infrastructure for LocalStack...");

  new ServiceStack(app, `ServiceStack-${envName}`, {
    env: targetEnv,
    envName,
    config,
    description: makeDescription(envName, "Service Infrastructure"),
    tags: makeTags(envName, config, "service-only"),
  });
} else {
  // AWS: Deploy CI/CD pipeline stack (which includes service infrastructure via stages)
  console.log("☁️ Deploying CI/CD pipeline stack for AWS environment...");

  new CicdStack(app, `CicdStack-${envName}`, {
    env: targetEnv,
    envName,
    config,
    description: makeDescription(envName, "CI/CD Stack"),
    tags: makeTags(envName, config, "pipeline-with-service"),
  });
}

app.synth();

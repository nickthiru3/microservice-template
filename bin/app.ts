// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config();

// Now load other modules
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CicdStack } from "../lib/cicd-stack";
import { ServiceStack } from "../lib/service-stack";

// Debug: Check if environment variables are loaded
console.log("🔍 Debug: Environment variables during synthesis:");
console.log("ENV_NAME:", process.env.ENV_NAME);
console.log("CODESTAR_CONNECTION_ID:", process.env.CODESTAR_CONNECTION_ID);
console.log("CDK_DEFAULT_ACCOUNT:", process.env.CDK_DEFAULT_ACCOUNT);

// Load environment configuration
const envName = process.env.ENV_NAME || "local";
const app = new cdk.App();

// Get configuration based on environment
let config;
try {
  // Try to load environment-specific config
  config = require(`../config/${envName}`).config;
} catch (error) {
  // Fall back to default config
  console.warn(
    `No specific config found for environment: ${envName}. Using default config.`
  );
  config = require("../config/default").config;
}

// Conditional stack deployment based on environment
if (envName === "local") {
  // LocalStack: Deploy only service infrastructure (no pipeline)
  console.log("🏠 Deploying service infrastructure for LocalStack...");

  new ServiceStack(app, `ServiceStack-${envName}`, {
    env: {
      account: "000000000000", // LocalStack default account
      region: config.region || "us-east-1", // LocalStack default region
    },
    envName,
    description: `Microservice Service Infrastructure (${envName})`,
    tags: {
      Environment: envName,
      Service: config.service?.name || "microservice",
      ServiceDisplayName:
        config.service?.displayName || config.service?.name || "Microservice",
      StackType: "service-only",
    },
  });
} else {
  // AWS: Deploy CI/CD pipeline stack (which includes service infrastructure via stages)
  console.log("☁️ Deploying CI/CD pipeline stack for AWS environment...");

  new CicdStack(app, `CicdStack-${envName}`, {
    env: {
      account: config.account,
      region: config.region,
    },
    envName: config.envName,
    description: `Microservice CI/CD Stack (${envName})`,
    tags: {
      Environment: envName,
      Service: config.service?.name || "microservice",
      ServiceDisplayName:
        config.service?.displayName || config.service?.name || "Microservice",
      StackType: "pipeline-with-service",
    },
  });
}

app.synth();

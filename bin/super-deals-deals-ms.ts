#!/usr/bin/env node
// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config();

// Now load other modules
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SuperDealsDealsMsStack } from "../lib/super-deals-deals-ms-stack";

// Debug: Check if environment variables are loaded
console.log('🔍 Debug: Environment variables during synthesis:');
console.log('ENV_NAME:', process.env.ENV_NAME);
console.log('CODESTAR_CONNECTION_ID:', process.env.CODESTAR_CONNECTION_ID);
console.log('CDK_DEFAULT_ACCOUNT:', process.env.CDK_DEFAULT_ACCOUNT);

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

// Create the stack with the appropriate configuration
new SuperDealsDealsMsStack(app, `SuperDealsDealsMsStack-${envName}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  envName: config.envName,
  description: `Super Deals Deals Microservice (${envName})`,
  tags: {
    Environment: envName,
    Service: "super-deals-deals-ms",
  },
});

app.synth();

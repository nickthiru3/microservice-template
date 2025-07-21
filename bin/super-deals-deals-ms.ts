#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SuperDealsDealsMsStack } from '#lib/super-deals-deals-ms-stack';

// Load environment configuration
const envName = process.env.ENV_NAME || 'local';
const app = new cdk.App();

// Get configuration based on environment
let config;
try {
  // Try to load environment-specific config
  config = require(`#config/${envName}`).config;
} catch (error) {
  // Fall back to default config
  console.warn(`No specific config found for environment: ${envName}. Using default config.`);
  config = require('../config/default').config;
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
    Service: 'super-deals-deals-ms',
  },
});

app.synth();

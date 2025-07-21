/**
 * Default configuration values for all environments
 */

export interface Config {
  envName: string;
  account: string | undefined;
  region: string;
  // GitHub and CodeStar configuration
  gitHubRepo?: string;
  gitHubBranch?: string;
  codestarConnectionId?: string;
  // Add other configuration properties here
}

const defaultConfig: Config = {
  envName: process.env.ENV_NAME || 'local',
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  // GitHub and CodeStar configuration
  gitHubRepo: 'nickthiru3/super-deals-deals-ms',
  gitHubBranch: 'main',
  codestarConnectionId: process.env.CODESTAR_CONNECTION_ID || 'your-connection-id',
  // Add other default values here
};

export const config: Config = {
  ...defaultConfig,
  // Override with environment-specific values if needed
};

export default config;

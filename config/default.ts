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
  // Parameter Store configuration
  parameterStorePrefix?: string;
  // Add other configuration properties here
}

/**
 * Get CodeStar connection ID with fallback hierarchy:
 * 1. Environment variable (for local development)
 * 2. Parameter Store lookup (for deployed environments)
 * 3. Error (no fallback to prevent deployment with placeholder)
 */
function getCodeStarConnectionId(envName: string): string {
  // First try environment variable (local development override)
  if (process.env.CODESTAR_CONNECTION_ID) {
    return process.env.CODESTAR_CONNECTION_ID;
  }
  
  // For deployed environments, we'll use Parameter Store lookup in the pipeline construct
  // This returns a token that will be resolved during deployment
  return `{{resolve:ssm:/platform/${envName}/github/codestar-connection-id}}`;
}

const defaultConfig: Config = {
  envName: process.env.ENV_NAME || 'local',
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  // GitHub and CodeStar configuration
  gitHubRepo: 'nickthiru3/super-deals-deals-ms',
  gitHubBranch: 'master',
  codestarConnectionId: getCodeStarConnectionId(process.env.ENV_NAME || 'dev'),
  // Parameter Store configuration
  parameterStorePrefix: `/platform/${process.env.ENV_NAME || 'dev'}`,
  // Add other default values here
};

export const config: Config = {
  ...defaultConfig,
  // Override with environment-specific values if needed
};

export default config;

/**
 * Default configuration values for all environments
 */

export interface Config {
  envName: string;
  account?: string;
  region: string;
  
  // Service metadata
  service?: {
    name: string;
    displayName: string;
  };
  
  // GitHub and CodeStar configuration
  github?: {
    repo: string;
    branch: string;
    codestarConnectionId: string;
  };
  
  // AWS configuration
  aws?: {
    region: string;
    profile?: string;
  };
  
  // Service endpoints (for LocalStack override)
  endpoints?: {
    dynamodb?: string;
    s3?: string;
    lambda?: string;
    apigateway?: string;
    sns?: string;
    sqs?: string;
    cloudwatch?: string;
    logs?: string;
    iam?: string;
    sts?: string;
    cloudformation?: string;
  };
  
  // Resource naming configuration
  resources?: {
    tablePrefix?: string;
    bucketPrefix?: string;
    functionPrefix?: string;
    apiPrefix?: string;
  };
  
  // Development-specific settings
  development?: {
    enableDebugLogs?: boolean;
    lambdaTimeout?: number;
    enableHotReload?: boolean;
    skipValidations?: boolean;
  };
  
  // Legacy properties for backward compatibility
  gitHubRepo?: string;
  gitHubBranch?: string;
  codestarConnectionId?: string;
  parameterStorePrefix?: string;
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
  // Account and region are required for all environments in Three-Flow architecture
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || (() => {
    throw new Error('AWS account ID is required. Set CDK_DEFAULT_ACCOUNT or AWS_ACCOUNT_ID environment variable.');
  })(),
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || (() => {
    throw new Error('AWS region is required. Set CDK_DEFAULT_REGION or AWS_DEFAULT_REGION environment variable.');
  })(),
  
  // Service metadata
  service: {
    name: process.env.SERVICE_NAME || (() => {
      throw new Error('Service name is required. Set SERVICE_NAME environment variable.');
    })(),
    displayName: process.env.SERVICE_DISPLAY_NAME || process.env.SERVICE_NAME || 'Microservice'
  },
  
  // GitHub configuration (new structure)
  github: {
    repo: process.env.GITHUB_REPO || (() => {
      throw new Error('GitHub repository is required. Set GITHUB_REPO environment variable.');
    })(),
    branch: process.env.GITHUB_BRANCH || 'release',
    codestarConnectionId: getCodeStarConnectionId(process.env.ENV_NAME || 'local')
  },
  
  // AWS configuration
  aws: {
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION || (() => {
      throw new Error('AWS region is required. Set CDK_DEFAULT_REGION or AWS_DEFAULT_REGION environment variable.');
    })(),
    profile: process.env.AWS_PROFILE
  },
  
  // Resource naming defaults (derived from service name)
  resources: {
    tablePrefix: process.env.RESOURCE_PREFIX || process.env.SERVICE_NAME || (() => {
      throw new Error('Resource prefix is required. Set RESOURCE_PREFIX or SERVICE_NAME environment variable.');
    })(),
    bucketPrefix: process.env.RESOURCE_PREFIX || process.env.SERVICE_NAME || (() => {
      throw new Error('Resource prefix is required. Set RESOURCE_PREFIX or SERVICE_NAME environment variable.');
    })(),
    functionPrefix: process.env.RESOURCE_PREFIX || process.env.SERVICE_NAME || (() => {
      throw new Error('Resource prefix is required. Set RESOURCE_PREFIX or SERVICE_NAME environment variable.');
    })(),
    apiPrefix: process.env.RESOURCE_PREFIX || process.env.SERVICE_NAME || (() => {
      throw new Error('Resource prefix is required. Set RESOURCE_PREFIX or SERVICE_NAME environment variable.');
    })()
  },
  
  // Legacy properties for backward compatibility
  gitHubRepo: process.env.GITHUB_REPO || (() => {
    throw new Error('GitHub repository is required. Set GITHUB_REPO environment variable.');
  })(),
  gitHubBranch: process.env.GITHUB_BRANCH || 'release',
  codestarConnectionId: getCodeStarConnectionId(process.env.ENV_NAME || 'local'),
  parameterStorePrefix: process.env.PARAMETER_STORE_PREFIX || (() => {
    throw new Error('Parameter store prefix is required. Set PARAMETER_STORE_PREFIX environment variable.');
  })()
};

/**
 * Load environment-specific configuration
 * Supports: local, localstack, staging, production
 * Validates that required properties (account, region) are present
 */
function loadConfig(): Config {
  const envName = process.env.ENV_NAME || 'local';
  
  let config: Config;
  
  try {
    // Try to load environment-specific config
    switch (envName) {
      case 'localstack':
        const localstackConfig = require('./localstack').default;
        config = { ...defaultConfig, ...localstackConfig };
        break;
      
      case 'staging':
        const stagingConfig = require('./staging').default;
        config = { ...defaultConfig, ...stagingConfig };
        break;
      
      case 'production':
        const productionConfig = require('./production').default;
        config = { ...defaultConfig, ...productionConfig };
        break;
      
      default:
        config = defaultConfig;
    }
  } catch (error) {
    console.warn(`Failed to load config for environment '${envName}', using default:`, error);
    config = defaultConfig;
  }
  
  // Validate required properties for Three-Flow architecture
  if (!config.account) {
    throw new Error(`AWS account ID is required for environment '${envName}'. Set CDK_DEFAULT_ACCOUNT or AWS_ACCOUNT_ID environment variable.`);
  }
  
  if (!config.region) {
    throw new Error(`AWS region is required for environment '${envName}'. Set CDK_DEFAULT_REGION environment variable or specify in config.`);
  }
  
  return config;
}

export default loadConfig();
export { defaultConfig, loadConfig };

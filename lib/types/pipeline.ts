import { Environment } from "aws-cdk-lib";
import { Config } from "./config";

/**
 * Configuration for a deployment stage in the pipeline
 */
export interface StageConfig {
  /**
   * Whether this stage is enabled for deployment
   * @default true
   */
  enabled?: boolean;

  /**
   * AWS account ID for this stage
   */
  account?: string;

  /**
   * AWS region for this stage
   */
  region?: string;

  /**
   * Stage-specific configuration overrides
   */
  [key: string]: any;
}

/**
 * Configuration for the pipeline
 * Ensures account and region are required for Three-Flow architecture
 */
export interface PipelineConfig extends Config {
  /**
   * AWS account ID (required for Three-Flow architecture)
   */
  account: string;
  
  /**
   * AWS region (required for Three-Flow architecture)
   */
  region: string;
  
  /**
   * Configuration for each deployment stage
   */
  stages?: Record<string, StageConfig>;

  /**
   * GitHub repository in format 'owner/repo'
   */
  gitHubRepo?: string;

  /**
   * GitHub branch to trigger the pipeline
   */
  gitHubBranch?: string;

  /**
   * AWS CodeStar connection ID for GitHub
   */
  codestarConnectionId?: string;

  /**
   * Name of the AWS Secrets Manager secret containing the GitHub token
   */
  gitHubTokenSecret?: string;
}

/**
 * Properties for the PipelineConstruct
 */
export interface PipelineStackProps {
  /**
   * The name of the environment (e.g., 'dev', 'staging', 'prod')
   */
  readonly envName: string;

  /**
   * The target deployment environment (account/region)
   */
  readonly env: Environment;

  /**
   * Pipeline configuration
   */
  readonly config: PipelineConfig;

  /**
   * GitHub repository in format 'owner/repo'
   * @default Uses value from config
   */
  readonly gitHubRepo?: string;

  /**
   * GitHub branch to trigger the pipeline
   * @default Uses value from config
   */
  readonly gitHubBranch?: string;

  /**
   * Name of the AWS Secrets Manager secret containing the GitHub token
   * @default Uses value from config
   */
  readonly gitHubTokenSecret?: string;
}

export * from "./config";

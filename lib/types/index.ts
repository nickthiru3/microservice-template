import * as cdk from 'aws-cdk-lib';

/**
 * Configuration interface for the application
 */
export interface Config {
  /**
   * The name of the environment (e.g., 'local', 'dev', 'staging', 'prod')
   */
  envName: string;
  
  /**
   * AWS account ID
   */
  account: string | undefined;
  
  /**
   * AWS region
   */
  region: string;
  
  /**
   * Add any additional configuration properties here
   */
  [key: string]: any;
}

export interface SuperDealsStackProps extends cdk.StackProps {
  /**
   * The name of the environment (e.g., 'dev', 'staging', 'prod')
   */
  readonly envName: string;
  
  /**
   * Environment configuration
   */
  readonly env: {
    account?: string;
    region?: string;
  };
  
  /**
   * Any additional custom properties for the stack
   */
  [key: string]: any;
}

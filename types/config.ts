/**
 * Configuration interface for the application
 */
export interface Config {
  /**
   * The name of the environment (e.g., 'local', 'dev', 'staging', 'prod')
   */
  envName: string;
  
  /**
   * AWS account ID (required for all environments)
   */
  account: string;
  
  /**
   * AWS region (required for all environments)
   */
  region: string;
  
  /**
   * Add any additional configuration properties here
   */
  [key: string]: any;
}

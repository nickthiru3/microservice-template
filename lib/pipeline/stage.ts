import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { Config } from "../types";

// Import your constructs
// import DbConstruct from "#lib/db/construct";
// import MonitorStack from "#lib/monitor/construct";
// import StorageStack from "#lib/storage/construct";
// import ApiConstruct from "#lib/api/construct";
import LambdaStack from "../lambda/stack";

/**
 * Properties for the PipelineStage
 */
export interface PipelineStageProps extends cdk.StageProps {
  /**
   * The name of the environment (e.g., 'dev', 'staging', 'prod')
   */
  readonly envName: string;

  /**
   * The target deployment environment (account/region)
   */
  readonly env: cdk.Environment;

  /**
   * Configuration object for the environment
   */
  readonly config: Config;
}

/**
 * Pipeline stage that represents a deployment environment
 */
export class PipelineStage extends cdk.Stage {
  // Public properties that can be accessed by the pipeline
  public readonly apiUrl?: string;

  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);

    const { envName, env, config } = props;

    // Skip deployment if the environment is disabled in the config
    if (config.enabled === false) {
      console.warn(`Skipping deployment for disabled environment: ${envName}`);
      return;
    }

    // Create a context object to pass to all constructs
    const context = {
      envName,
      env,
      config: {
        ...config,
        // Allow stage-specific overrides
        ...(config.stages?.[envName] || {}),
      },
    };

    // Initialize your constructs with the context
    const lambda = new LambdaStack(this, "LambdaStack", context);

    // Initialize other constructs as needed
    // const db = new DbConstruct(this, "DbConstruct", context);
    // const monitor = new MonitorStack(this, "MonitorStack", context);
    // const storage = new StorageStack(this, "StorageStack", context);
    // const api = new ApiConstruct(this, "ApiConstruct", context);

    // Store outputs that might be needed by the pipeline
    // this.apiUrl = api.apiUrl;

    // Set up dependencies between constructs if needed
    // monitor.addDependency(db);
    // storage.addDependency(db);
    // api.addDependency(storage);
  }
}

export default PipelineStage;

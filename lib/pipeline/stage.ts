import { Construct } from "constructs";
import { Stage, StageProps, Environment } from "aws-cdk-lib";
import type { Config } from "#config/default";

// Import your constructs
// import DbStack from "../db/stack";
// import MonitorStack from "../monitor/stack";
// import StorageStack from "../storage/stack";
// import ApiStack from "../api/stack";
import { ServiceStack } from "../service-stack";

/**
 * Properties for the PipelineStage
 */
export interface PipelineStageProps extends StageProps {
  /**
   * The name of the environment (e.g., 'dev', 'staging', 'prod')
   */
  readonly envName: string;

  /**
   * The target deployment environment (account/region)
   */
  readonly env: Environment;
  /**
   * Fully-resolved configuration for this deployment run
   */
  readonly config: Config;
}

/**
 * Pipeline stage that represents a deployment environment
 */
export class PipelineStage extends Stage {
  // Public properties that can be accessed by the pipeline
  public readonly apiUrl?: string;

  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);

    const { envName, env, config } = props;

    new ServiceStack(this, "ServiceStack", {
      envName,
      env,
      config,
    });
  }
}

export default PipelineStage;

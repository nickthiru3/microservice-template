import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { Config } from "../../types";

// Import your constructs
// import DbStack from "../db/stack";
// import MonitorStack from "../monitor/stack";
// import StorageStack from "../storage/stack";
// import ApiStack from "../api/stack";
import { ServiceStack } from "../service-stack";

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

    new ServiceStack(this, "ServiceStack", {
      envName,
      env,
    });
  }
}

export default PipelineStage;

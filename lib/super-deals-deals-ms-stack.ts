import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SuperDealsStackProps } from "./types";
import PipelineStack from "./pipeline/stack";
import { PipelineConfig } from "./types/pipeline";
import config from "../config/default";

export class SuperDealsDealsMsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SuperDealsStackProps) {
    super(scope, id, props);

    const { envName, env } = props;

    // In Three-Flow architecture, account and region are required for all environments
    // Use explicit values from config (which enforces required values) or environment props
    const pipelineEnv = {
      account: env?.account || config.account,
      region: env?.region || config.region,
    };

    new PipelineStack(this, "PipelineStack", {
      envName,
      env: pipelineEnv,
      config: config as PipelineConfig,
      gitHubTokenSecret: "github-token-nickthiru3",
    });
  }
}

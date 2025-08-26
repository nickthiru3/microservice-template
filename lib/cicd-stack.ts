import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import PipelineConstruct from "./pipeline/construct";
import type { Config } from "#config/default";

/**
 * Note on env vs config:
 * - This props interface extends CDK's StackProps, so `env` (account/region) is available implicitly.
 * - We pass `env` when creating the Stack so CDK binds this stack to a specific account/region (bootstrap/assets/lookups).
 * - Internally we prefer values from `config` (single source of truth) and warn if they drift from `props.env`.
 */
interface CicdStackProps extends StackProps {
  envName: string;
  config: Config;
}

export class CicdStack extends Stack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const { envName, env, config } = props;

    new PipelineConstruct(this, "PipelineStack", {
      envName,
      env: env!,
      config,
    });
  }
}

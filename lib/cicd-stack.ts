import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import PipelineConstruct from "./pipeline/construct";
import type { IConfig } from "#config/default";

/**
 * Note on env vs config:
 * - This props interface extends CDK's StackProps, so `env` (account/region) is available implicitly.
 * - We pass `env` when creating the Stack so CDK binds this stack to a specific account/region (bootstrap/assets/lookups).
 * - Internally we prefer values from `config` (single source of truth) and warn if they drift from `props.env`.
 */
interface ICicdStackProps extends StackProps {
  readonly envName: string;
  readonly config: IConfig;
}

export class CicdStack extends Stack {
  constructor(scope: Construct, id: string, props: ICicdStackProps) {
    super(scope, id, props);

    const { envName, env, config } = props;

    new PipelineConstruct(this, "PipelineStack", {
      envName,
      env: env!,
      config,
    });
  }
}

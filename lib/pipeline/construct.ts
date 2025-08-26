import { Construct } from "constructs";
import { Environment, Aws } from "aws-cdk-lib";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  type AddStageOpts,
} from "aws-cdk-lib/pipelines";
import { LinuxBuildImage } from "aws-cdk-lib/aws-codebuild";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import PipelineStage from "./stage";
import type { Config } from "#config/default";

/**
 * Pipeline construct that sets up a CI/CD pipeline using AWS CodePipeline
 */
// Local props type colocated with construct, using Config as the source of truth
interface PipelineConstructProps {
  readonly envName: string;
  readonly env: Environment;
  readonly config: Config & {
    stages?: Record<
      string,
      { enabled?: boolean; account?: string; region?: string }
    >;
  };
  readonly gitHubRepo?: string;
  readonly gitHubBranch?: string;
}

export class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PipelineConstructProps) {
    super(scope, id);

    const { envName, env, config } = props;
    const cfg = config;

    // GitHub configuration with fallbacks to config values
    const gitHubRepo =
      props.gitHubRepo ??
      cfg.github?.repo ??
      cfg.gitHubRepo ??
      "nickthiru3/super-deals-deals-ms";
    const gitHubBranch =
      props.gitHubBranch ?? cfg.github?.branch ?? cfg.gitHubBranch ?? "main";

    // Note: GitHub token secret is not needed when using CodeStar connections
    // CodeStar connections handle OAuth authentication automatically

    // Create the pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: `super-deals-deals-ms-${envName}-pipeline`,
      crossAccountKeys: false,
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection(gitHubRepo, gitHubBranch, {
          connectionArn: `arn:aws:codestar-connections:${cfg.region || env.region}:${
            cfg.account || env.account
          }:connection/${
            cfg.github?.codestarConnectionId ?? cfg.codestarConnectionId
          }`,
          triggerOnPush: false,
        }),
        installCommands: [
          "echo 'Node.js version:' && node --version",
          "echo 'npm version:' && npm --version",
          "echo 'Installing dependencies...'",
          "npm ci --verbose --no-audit --no-fund --ignore-scripts --include=dev",
        ],
        commands: [
          "echo 'Starting build process...'",
          "npm run build",
          "echo 'Starting CDK synthesis...'",
          "npx cdk synth",
        ],
        env: {
          NODE_ENV: "production",
        },
        primaryOutputDirectory: "cdk.out",
        rolePolicyStatements: [
          new PolicyStatement({
            actions: ["sts:AssumeRole"],
            resources: ["*"],
            conditions: {
              "ForAnyValue:StringEquals": {
                "iam:ResourceTag/aws-cdk:bootstrap-role": [
                  "image-pulling",
                  "file-publishing",
                  "deploy",
                ],
              },
            },
          }),
        ],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
          privileged: true, // Required for building Docker images if needed
          environmentVariables: {
            NODE_VERSION: {
              value: "22", // Specify Node.js 22 for compatibility
            },
          },
        },
      },
    });

    // Add stages based on environment configuration
    if (cfg.stages) {
      for (const [stageName, stageConfig] of Object.entries(cfg.stages)) {
        // Only create stages that are enabled in the config (default to true if not specified)
        if (stageConfig?.enabled !== false) {
          const stageEnv: Environment = {
            account:
              stageConfig?.account ||
              cfg.account ||
              env.account ||
              Aws.ACCOUNT_ID,
            region:
              stageConfig?.region || cfg.region || env.region || Aws.REGION,
          };

          // Create the stage with merged config
          const stage = new PipelineStage(this, `${stageName}Stage`, {
            envName: stageName,
            env: stageEnv,
            config: cfg,
          });

          // Set up stage options
          const stageOptions: AddStageOpts = {
            // Add manual approval for production stages
            pre:
              stageName === "production" || stageName === "prod"
                ? [new ManualApprovalStep("PromoteToProduction")]
                : undefined,
          };

          // Add the stage to the pipeline
          pipeline.addStage(stage, stageOptions);
        }
      }
    } else {
      // Fallback for backward compatibility
      const stage = new PipelineStage(this, `${envName}Stage`, {
        envName,
        env: {
          account: cfg.account || env.account || Aws.ACCOUNT_ID,
          region: cfg.region || env.region || Aws.REGION,
        },
        config: cfg,
      });

      pipeline.addStage(stage);
    }

    // Add pre-synth validation steps
    pipeline.addWave("PreSynth", {
      pre: [
        new CodeBuildStep("RunUnitTests", {
          commands: ["npm ci", "npm test"],
        }),
      ],
    });
  }
}

export default PipelineConstruct;

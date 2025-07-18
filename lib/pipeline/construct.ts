import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  CodeBuildStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { SecretValue } from "aws-cdk-lib/core";

import PipelineStage from "./stage/construct";

interface PipelineProps {
  readonly envName: string;
  readonly env: { account: string; region: string };
  readonly gitHubRepo?: string; // Optional GitHub repo name
  readonly gitHubBranch?: string; // Optional GitHub branch name
  readonly gitHubTokenSecret?: string; // Optional secret name for GitHub token
}

class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id, props);

    const { envName, env } = props;

    // Use provided values or defaults
    const gitHubRepo = props.gitHubRepo || "nickthiru2/ms-env-sandbox";
    const gitHubBranch = props.gitHubBranch || "main";
    const gitHubTokenSecret = props.gitHubTokenSecret || "github-token";

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: `${envName}-Pipeline`,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(gitHubRepo, gitHubBranch, {
          authentication: SecretValue.secretsManager(gitHubTokenSecret),
        }),
        commands: ["npm ci", "npx cdk synth"],
      }),
    });

    // Add a test stage to the pipeline with the environment name
    const testStage = pipeline.addStage(
      new PipelineStage(this, "PipelineStage", {
        envName,
        env,
      })
    );

    testStage.addPre(
      new CodeBuildStep("unit-tests", {
        commands: ["cd super-deals-deals-ms", "npm ci", "npm test"],
      })
    );
  }
}

export default PipelineConstruct;

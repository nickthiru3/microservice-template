import { Construct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import DbConstruct from "../../db/construct";

// Define the properties for our pipeline stage
export interface PipelineStageProps extends StageProps {
  readonly envName: string;
  readonly env: { account: string; region: string };
}

class PipelineStage extends Construct {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);

    const { envName, env } = props;

    new DbConstruct(this, "DbConstruct", {
      envName,
    });

    // Set dependencies to ensure proper deployment order
    // eksStack.addDependency(networkStack);
    // argoCDStack.addDependency(eksStack);
  }
}

export default PipelineStage;

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import PipelineConstruct from "./pipeline/construct";

export class SuperDealsDealsMsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new PipelineConstruct(this, "PipelineConstruct", {
      envName: "test",
      env: {
        account: "123456789012",
        region: "us-east-1",
      },
    });
  }
}

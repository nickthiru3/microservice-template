import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { Construct } from "constructs";

class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    new NodejsFunction(this, "hello-lambda", {
      runtime: Runtime.NODEJS_22_X,
      handler: "handler",
      entry: join(__dirname, "..", "..", "src", "lambda", "lambda-handler.ts"),
      environment: {
        STAGE: props.envName,
      },
    });
  }
}

export default LambdaStack;

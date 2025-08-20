import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import path from "path";

interface ServicesDiscoveryConstructProps {
  readonly envName: string;
  readonly ssmPublicPath?: string;
  readonly region?: string;
}

class ServicesDiscoveryConstruct extends Construct {
  lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: ServicesDiscoveryConstructProps) {
    super(scope, id);

    const { envName, ssmPublicPath, region } = props;

    this.lambda = new NodejsFunction(this, "NodejsFunction", {
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        "../../../src/services/services-discovery/lambda-handler.ts"
      ),
      handler: "handler",
      depsLockFilePath: require.resolve("#package-lock"),
      environment: {
        ENV_NAME: envName,
        AWS_REGION: region ?? process.env.AWS_REGION ?? "",
        SSM_PUBLIC_PATH: ssmPublicPath ?? "",
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ssm:GetParametersByPath"],
          resources: [
            `arn:aws:ssm:*:*:parameter${ssmPublicPath ?? ''}*`,
          ],
        }),
      ],
    });
  }
}

export default ServicesDiscoveryConstruct;

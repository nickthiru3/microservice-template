import { Construct } from "constructs";
import { StringParameter, ParameterTier } from "aws-cdk-lib/aws-ssm";

interface ISsmPublicationsConstructProps {
  readonly basePath: string;
  readonly values: Record<string, string>;
}

class SsmPublicationsConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ISsmPublicationsConstructProps
  ) {
    super(scope, id);

    const { basePath, values } = props;

    Object.entries(values).forEach(([key, value]) => {
      const safeKey = key.replace(/[^A-Za-z0-9]/g, "_");
      const name = `${basePath}/${key}`.replace(/\/+/, "/");
      new StringParameter(this, `Param_${safeKey}`, {
        parameterName: name,
        stringValue: value ?? "",
        tier: ParameterTier.STANDARD,
      });
    });
  }
}

export default SsmPublicationsConstruct;

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import Alarm4xxStack from "./4xx/stack";

interface ApiMonitoringStackProps extends cdk.StackProps {
  readonly envName: string;
}

class ApiMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiMonitoringStackProps) {
    super(scope, id, props);

    const { envName } = props;

    new Alarm4xxStack(this, "Alarm4xxStack", { envName });
  }
}

export default ApiMonitoringStack;

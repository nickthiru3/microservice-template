import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import Alarm4xxConstruct from "./4xx/stack";

interface ApiMonitoringStackProps extends cdk.StackProps {
  readonly envName: string;
}

class ApiMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiMonitoringStackProps) {
    super(scope, id, props);

    const { envName } = props;

    new Alarm4xxConstruct(this, "Alarm4xxConstruct", { envName });
  }
}

export default ApiMonitoringStack;

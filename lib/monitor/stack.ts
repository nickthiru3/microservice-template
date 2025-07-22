import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import ApiMonitoringConstruct from "./api/stack";

interface MonitorStackProps extends cdk.StackProps {
  readonly envName: string;
}

class MonitorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitorStackProps) {
    super(scope, id, props);

    const { envName } = props;

    new ApiMonitoringConstruct(this, "ApiMonitoringConstruct", { envName });
  }
}

export default MonitorStack;

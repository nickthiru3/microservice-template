import { Construct } from "constructs";
import ApiMonitoringConstruct from "./api/construct";

interface MonitorStackProps {
  readonly envName: string;
}

class MonitorStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitorStackProps) {
    super(scope, id, props);

    const { envName } = props;

    new ApiMonitoringConstruct(this, "ApiMonitoringConstruct", { envName });
  }
}

export default MonitorStack;

import { Construct } from "constructs";
import ApiMonitoringConstruct from "./api/construct";

interface MonitorConstructProps {
  readonly envName: string;
}

class MonitorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitorConstructProps) {
    super(scope, id);

    const { envName } = props;

    new ApiMonitoringConstruct(this, "ApiMonitoringConstruct", { envName });
  }
}

export default MonitorConstruct;

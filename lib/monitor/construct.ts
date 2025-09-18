import { Construct } from "constructs";
import ApiMonitoringConstruct from "./api/construct";
import type { IConfig } from "#config/default";

interface IMonitoringConstructProps {
  readonly config: IConfig;
}

class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IMonitoringConstructProps) {
    super(scope, id);

    const { config } = props;

    new ApiMonitoringConstruct(this, "ApiMonitoringConstruct", { config });
  }
}

export default MonitoringConstruct;

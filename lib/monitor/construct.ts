import { Construct } from "constructs";
import ApiMonitorConstruct from "./api/construct";
import BindingsConstruct from "#lib/bindings/construct";
import type { IConfig } from "#config/default";

interface IMonitorConstructProps {
  readonly config: IConfig;
  readonly bindings: BindingsConstruct;
}

class MonitorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IMonitorConstructProps) {
    super(scope, id);

    const { config, bindings } = props;

    new ApiMonitorConstruct(this, "ApiMonitorConstruct", {
      config,
      bindings,
    });
  }
}

export default MonitorConstruct;

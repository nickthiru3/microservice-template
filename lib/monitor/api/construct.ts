import { Construct } from "constructs";
import Alarm4xxConstruct from "./4xx/construct";
import BindingsConstruct from "#lib/bindings/construct";
import type { IConfig } from "#config/default";

interface IApiMonitorConstructProps {
  readonly config: IConfig;
  readonly bindings: BindingsConstruct;
}

class ApiMonitorConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IApiMonitorConstructProps) {
    super(scope, id);

    const { config, bindings } = props;

    new Alarm4xxConstruct(this, "Alarm4xxConstruct", {
      config,
      bindings,
    });
  }
}

export default ApiMonitorConstruct;

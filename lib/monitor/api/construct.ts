import { Construct } from "constructs";
import Alarm4xxConstruct from "./4xx/construct";
import type { IConfig } from "#config/default";

interface IApiMonitoringConstructProps {
  readonly config: IConfig;
}

class ApiMonitoringConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: IApiMonitoringConstructProps
  ) {
    super(scope, id);

    const { config } = props;

    new Alarm4xxConstruct(this, "Alarm4xxConstruct", { config });
  }
}

export default ApiMonitoringConstruct;

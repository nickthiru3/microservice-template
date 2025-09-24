import { Construct } from "constructs";
import BindingsUtilConstruct from "#lib/utils/bindings/construct";
import type { IMonitorBindings } from "@super-deals/infra-contracts";
import type { IConfig } from "#config/default";

interface IMonitorBindingsConstructProps {
  readonly config: IConfig;
}

class MonitorBindingsConstruct extends Construct {
  public readonly slackWebHookUrl: string;

  constructor(
    scope: Construct,
    id: string,
    props: IMonitorBindingsConstructProps
  ) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;
    // Must match the service name used by the producer when publishing to SSM
    // Users service currently publishes under '/super-deals/<env>/Users/public/...'
    const producerServiceName = "platform";

    const spec = {
      slackWebHookUrl: "Monitor/slack/webHookUrl",
    } as const;

    const bindings = new BindingsUtilConstruct<IMonitorBindings>(
      this,
      "MonitorBindings",
      {
        envName,
        producerServiceName,
        visibility: "private",
        spec,
      }
    );

    this.slackWebHookUrl = bindings.values.slackWebHookUrl;
  }
}

export default MonitorBindingsConstruct;

import { Construct } from "constructs";
import AuthBindingsConstruct from "./auth/construct";
import IamBindingsConstruct from "./iam/construct";
import MonitorBindingsConstruct from "./monitor/construct";
import type { IConfig } from "#config/default";

interface ISsmBindingsConstructProps {
  readonly config: IConfig;
}

class SsmBindingsConstruct extends Construct {
  public readonly auth: AuthBindingsConstruct;
  public readonly iam: IamBindingsConstruct;
  public readonly monitor: MonitorBindingsConstruct;

  constructor(scope: Construct, id: string, props: ISsmBindingsConstructProps) {
    super(scope, id);

    const { config } = props;

    this.auth = new AuthBindingsConstruct(this, "AuthBindingsConstruct", {
      config,
    });

    this.iam = new IamBindingsConstruct(this, "IamBindingsConstruct", {
      config,
    });

    this.monitor = new MonitorBindingsConstruct(
      this,
      "MonitorBindingsConstruct",
      {
        config,
      }
    );
  }
}

export default SsmBindingsConstruct;

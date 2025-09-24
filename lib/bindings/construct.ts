import { Construct } from "constructs";
import AuthBindingsConstruct from "./auth/construct";
import IamBindingsConstruct from "./iam/construct";
import MonitorBindingsConstruct from "./monitor/construct";
import type { IConfig } from "#config/default";

type IBindingsConstructProps = {
  readonly config: IConfig;
};

class BindingsConstruct extends Construct {
  auth: AuthBindingsConstruct;
  iam: IamBindingsConstruct;
  monitor: MonitorBindingsConstruct;

  constructor(scope: Construct, id: string, props: IBindingsConstructProps) {
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

export default BindingsConstruct;

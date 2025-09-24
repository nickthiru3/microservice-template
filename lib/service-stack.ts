import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import BindingsConstruct from "./bindings/construct";
import MonitorConstruct from "./monitor/construct";
import DatabaseConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import PermissionsConstruct from "./permissions/construct";
import ApiConstruct from "./api/construct";
// import EventsConstruct from "./events/construct";
import type { IConfig } from "#config/default";

interface IServiceStackProps extends StackProps {
  readonly config: IConfig;
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: IServiceStackProps) {
    super(scope, id, props);

    const { config } = props;

    const bindings = new BindingsConstruct(this, "BindingsConstruct", {
      config,
    });

    new MonitorConstruct(this, "MonitorConstruct", {
      config,
      bindings,
    });

    const db = new DatabaseConstruct(this, "DatabaseConstruct", {
      config,
    });

    const storage = new StorageConstruct(this, "StorageConstruct", {
      config,
    });

    const permissions = new PermissionsConstruct(this, "PermissionsConstruct", {
      config,
      bindings,
      storage,
    });

    new ApiConstruct(this, "ApiConstruct", {
      config,
      db,
      bindings,
      permissions,
    });

    // new EventsConstruct(this, "EventsConstruct", {
    //   config,
    // });
  }
}

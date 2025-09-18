import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import MonitoringConstruct from "./monitor/construct";
import DatabaseConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import PermissionsConstruct from "./permissions/construct";
import ApiConstruct from "./api/construct";
// import EventsConstruct from "./events/construct";
import AuthBindingsConstruct from "./auth/construct";
import IamBindingsConstruct from "./iam/construct";
import type { IConfig } from "#config/default";

interface IServiceStackProps extends StackProps {
  readonly config: IConfig;
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: IServiceStackProps) {
    super(scope, id, props);

    const { config } = props;

    new MonitoringConstruct(this, "MonitoringConstruct", {
      config,
    });

    const db = new DatabaseConstruct(this, "DatabaseConstruct", {
      config,
    });

    const storage = new StorageConstruct(this, "StorageConstruct", {
      config,
    });

    // Import shared auth/IAM primitives via infra-contracts (SSM)
    const auth = new AuthBindingsConstruct(this, "AuthBindingsConstruct", {
      config,
    });
    const iam = new IamBindingsConstruct(this, "IamBindingsConstruct", {
      config,
    });

    const permissions = new PermissionsConstruct(this, "PermissionsConstruct", {
      config,
      iam,
      auth,
      storage,
    });

    new ApiConstruct(this, "ApiConstruct", {
      config,
      db,
      auth,
      permissions,
    });

    // new EventsConstruct(this, "EventsConstruct", {
    //   config,
    // });
  }
}

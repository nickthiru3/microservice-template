import { Construct } from "constructs";
import { Stack, StackProps, Aws } from "aws-cdk-lib";
import MonitorConstruct from "./monitor/construct";
import DbConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import PermissionsConstruct from "./permissions/construct";
import ServicesConstruct from "./services/construct";
import ApiConstruct from "./api/construct";
// import EventsConstruct from "./events/construct";
import AuthBindingsConstruct from "./auth/construct";
import IamBindingsConstruct from "./iam/construct";
import SsmPublicationConstruct from "./ssm-publications/construct";

interface ServiceStackProps extends StackProps {
  envName: string;
}

/**
 * Service stack containing all microservice infrastructure constructs
 * Used by both LocalStack (local development) and AWS Pipeline (staging/production)
 */
export class ServiceStack extends Stack {
  public readonly database: DbConstruct;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const { envName } = props;

    const monitor = new MonitorConstruct(this, "MonitorConstruct", {
      envName,
    });

    // Database construct with configuration from config/database.ts
    const db = new DbConstruct(this, "DatabaseConstruct", {
      envName,
      serviceName: "deals-ms",
    });

    const storage = new StorageConstruct(this, "StorageConstruct", {
      envName,
    });

    // Import shared auth/IAM primitives via infra-contracts (SSM)
    const auth = new AuthBindingsConstruct(this, "AuthBindingsConstruct", {
      envName,
    });
    const iam = new IamBindingsConstruct(this, "IamBindingsConstruct", {
      envName,
    });

    const permissions = new PermissionsConstruct(this, "PermissionsConstruct", {
      envName,
      iam,
      auth,
      storage,
    });

    const services = new ServicesConstruct(this, "ServicesConstruct", {
      envName,
      db,
    });

    const api = new ApiConstruct(this, "ApiConstruct", {
      envName,
      userPool: auth.userPool,
      permissions,
      services,
    });

    // const events = new EventsConstruct(this, "EventsConstruct", {
    //   envName,
    // });

    // Publish deals-ms public bindings at the stack level
    const region = Aws.REGION;
    new SsmPublicationConstruct(this, "DealsMsPublicBindings", {
      basePath: `/super-deals/${envName}/deals-ms/public`,
      values: {
        region,
      },
    });

    // Set up dependencies between constructs if needed
    // monitor.node.addDependency(this.database);
    // storage.node.addDependency(this.database);
    // api.node.addDependency(storage);
  }
}

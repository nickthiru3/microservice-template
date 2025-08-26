import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
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
import { buildSsmPublicPath } from "#src/helpers/ssm";
import type { Config } from "#config/default";

/**
 * Note on env vs config:
 * - This props interface extends CDK's StackProps, so `env` (account/region) is available implicitly.
 * - We pass `env` when instantiating the Stack so CDK knows the deploy target (bootstrap, asset roles, lookups).
 * - Inside the stack/constructs, we treat `config` as the single source of truth for account/region/envName.
 *   Therefore, we reference `config.region` etc. for internal wiring, and only rely on `props.env` for CDK targeting.
 */

interface ServiceStackProps extends StackProps {
  envName: string;
  config: Config;
}

/**
 * Service stack containing all microservice infrastructure constructs
 * Used by both LocalStack (local development) and AWS Pipeline (staging/production)
 */
export class ServiceStack extends Stack {
  public readonly database: DbConstruct;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const { envName, config } = props;
    // Use region from config for internal wiring. props.env is still required by CDK for targeting.
    const region = config.region;

    new MonitorConstruct(this, "MonitorConstruct", {
      envName,
    });

    const db = new DbConstruct(this, "DatabaseConstruct", {
      envName,
      serviceName: config.service.name,
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
      region,
    });

    new ApiConstruct(this, "ApiConstruct", {
      envName,
      auth,
      permissions,
      services,
    });

    // const events = new EventsConstruct(this, "EventsConstruct", {
    //   envName,
    // });

    // Publish public bindings at the stack level
    new SsmPublicationConstruct(this, "ServicePublicBindings", {
      basePath: buildSsmPublicPath(envName, config.service.name),
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

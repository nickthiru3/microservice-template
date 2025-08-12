import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import DbConstruct from "./db/construct";
import StorageConstruct from "./storage/construct";
import PermissionsConstruct from "./permissions/construct";
import ServicesConstruct from "./services/construct";
import ApiStack from "./api/construct";
import MonitorConstruct from "./monitor/construct";

interface ServiceStackProps extends StackProps {
  envName: string;
}

/**
 * Service stack containing all microservice infrastructure constructs
 * Used by both LocalStack (local development) and AWS Pipeline (staging/production)
 */
export class ServiceStack extends Stack {
  /**
   * DynamoDB table construct
   */
  public readonly database: DbConstruct;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // Database construct with configuration from config/database.ts
    const database = new DbConstruct(this, "Database", {
      envName,
      serviceName: "deals-ms",
    });

    const storage = new StorageConstruct(this, "Storage", {
      envName,
    });

    const permissions = new PermissionsConstruct(this, "PermissionsStack", {
      iam,
      storage,
      auth,
    });

    const services = new ServicesConstruct(this, "ServicesStack", {
      envName,
      auth,
      db,
      sns,
      email,
    });

    const api = new ApiStack(this, "Api", {
      envName,
      auth,
      permissions,
      services,
    });

    const monitor = new MonitorConstruct(this, "Monitor", {
      envName,
    });

    // Set up dependencies between constructs if needed
    // monitor.node.addDependency(this.database);
    // storage.node.addDependency(this.database);
    // api.node.addDependency(storage);
  }
}

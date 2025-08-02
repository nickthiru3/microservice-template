import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import LambdaConstruct from "./lambda/construct";

interface ServiceStackProps extends cdk.StackProps {
  envName: string;
}

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    // new LambdaConstruct(this, "lambda", {
    //   envName: props.envName,
    // });

    // Initialize your constructs with the context
    // const db = new DbStack(this, "DbStack", context);
    // const monitor = new MonitorStack(this, "MonitorStack", context);
    // const storage = new StorageStack(this, "StorageStack", context);
    // const api = new ApiStack(this, "ApiStack", context);

    // Store outputs that might be needed by the pipeline
    // this.apiUrl = api.apiUrl;

    // Set up dependencies between constructs if needed
    // monitor.addDependency(db);
    // storage.addDependency(db);
    // api.addDependency(storage);
  }
}

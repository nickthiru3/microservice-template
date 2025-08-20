import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import path from "path";

interface SnsLogSubscriptionConstructProps {
  logGroupName: string;
  retention?: RetentionDays;
}

/**
 * A construct that creates an SNS subscription that logs messages to CloudWatch Logs
 */
class SnsLogSubscriptionConstruct extends Construct {
  logGroup: LogGroup;
  lambda: NodejsFunction;
  subscription: LambdaSubscription;

  constructor(
    scope: Construct,
    id: string,
    props: SnsLogSubscriptionConstructProps
  ) {
    super(scope, id);

    const { logGroupName, retention = RetentionDays.ONE_MONTH } = props;

    // Create a log group
    this.logGroup = new LogGroup(this, "LogGroup", {
      logGroupName,
      retention,
    });

    // Create the Lambda function that will process SNS messages
    this.lambda = new NodejsFunction(this, "Function", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambda-handler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk"],
      },
      environment: {
        LOG_GROUP_NAME: this.logGroup.logGroupName,
      },
    });

    // Grant permissions for the Lambda to write to the log group
    this.logGroup.grantWrite(this.lambda);

    // Create the subscription
    this.subscription = new LambdaSubscription(this.lambda);
  }
}

interface SnsToCloudWatchLogsLambdaSubscriptionProps {
  logGroup?: LogGroup;
  logGroupName?: string;
  retention?: RetentionDays;
}

/**
 * A utility class that creates an SNS subscription for logging to CloudWatch
 */
class SnsToCloudWatchLogsSubscription extends LambdaSubscription {
  constructor(
    scope: Construct,
    id: string,
    props: SnsToCloudWatchLogsLambdaSubscriptionProps
  ) {
    const { logGroup, logGroupName, retention } = props;

    // If a log group is provided, use it; otherwise create a new SnsLogSubscription
    if (logGroup) {
      // Create a Lambda function for the provided log group
      const lambda = new NodejsFunction(scope, `${id}Function`, {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "lambda-handler.ts"),
        handler: "handler",
        bundling: {
          externalModules: ["@aws-sdk"],
        },
        environment: {
          LOG_GROUP_NAME: logGroup.logGroupName,
        },
      });

      // Grant permissions
      logGroup.grantWrite(lambda);

      // Call parent constructor with the Lambda
      super(lambda);
    } else {
      // Create a full SnsLogSubscription construct
      const logSubscription = new SnsLogSubscriptionConstruct(scope, id, {
        logGroupName: logGroupName!,
        retention,
      });

      // Call parent constructor with the Lambda from the subscription
      super(logSubscription.lambda);
    }
  }
}

export default SnsToCloudWatchLogsSubscription;

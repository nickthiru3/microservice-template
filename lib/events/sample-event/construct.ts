import { Construct } from "constructs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnOutput } from "aws-cdk-lib";
import SnsToCloudWatchLogsSubscription from "../../utils/sns-log-subscription/construct";

interface SampleEventConstructProps {
  envName: string;
}

class SampleEventConstruct extends Construct {
  topic: Topic;
  logSubscription: SnsToCloudWatchLogsSubscription;

  constructor(scope: Construct, id: string, props: SampleEventConstructProps) {
    super(scope, id);

    this.topic = new Topic(this, "SampleEventTopic", {
      topicName: "SampleEvent",
      displayName: "SampleEvent",
    });

    // Option 1: Create a log group separately and pass it
    const logGroup = new LogGroup(this, "SignUpCompletedTopicLogGroup", {
      retention: RetentionDays.ONE_MONTH,
    });

    this.topic.addSubscription(
      new SnsToCloudWatchLogsSubscription(this, "LogSubscription", {
        logGroup,
      })
    );

    // Option 2: Let the subscription create its own log group
    // this.topic.addSubscription(
    //   new SnsToCloudWatchLogsSubscription(this, "LogSubscription", {
    //     logGroupName: "/aws/sns/SignUpCompleted",
    //     retention: RetentionDays.ONE_MONTH
    //   })
    // );

    // Add CfnOutput for the topic ARN
    new CfnOutput(this, "SampleEventTopicArn", {
      value: this.topic.topicArn,
      description: "ARN of the SNS topic for sample event",
      exportName: "SampleEventTopicArn",
    });
  }
}

export default SampleEventConstruct;

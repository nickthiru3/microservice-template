import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { join } from "path";

interface Alarm4xxStackProps extends cdk.StackProps {
  readonly envName: string;
}

class Alarm4xxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Alarm4xxStackProps) {
    super(scope, id, props);

    const { envName } = props;

    const lambda = new NodejsFunction(this, "Lambda", {
      bundling: {
        forceDockerBundling: true,
      },
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, "#src/monitor/api/4xx/handler.ts"),
      handler: "handler",
      depsLockFilePath: require.resolve("#package-lock"),
    });

    const topic = new Topic(this, "Topic", {
      displayName: "AlarmTopic",
      topicName: "AlarmTopic",
    });

    topic.addSubscription(new LambdaSubscription(lambda));

    const alarm4xx = new Alarm(this, "4xxAlarm", {
      metric: new Metric({
        metricName: "4XXError",
        namespace: "AWS/ApiGateway",
        period: Duration.minutes(1),
        statistic: "Sum",
        unit: Unit.COUNT,
        dimensionsMap: {
          ApiName: envName,
        },
      }),
      evaluationPeriods: 1,
      threshold: 5,
      alarmName: `${envName}SuperDealsApi4xxAlarm`,
    });

    const topicAction = new SnsAction(topic);

    alarm4xx.addAlarmAction(topicAction);

    alarm4xx.addOkAction(topicAction);
  }
}

export default Alarm4xxStack;

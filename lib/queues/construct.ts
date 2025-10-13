import { Construct } from "constructs";
import {
  Queue,
  QueueEncryption,
  DeadLetterQueue,
} from "aws-cdk-lib/aws-sqs";
import { Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { type ITopic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Key, KeyUsage } from "aws-cdk-lib/aws-kms";
import { PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import path from "path";
import type { IConfig } from "#config/default";

interface IQueueConstructProps {
  readonly config: IConfig;
  readonly subscribeToTopic?: ITopic;
  readonly queueVisibilityTimeout?: Duration;
  readonly deadLetterQueueMaxReceiveCount?: number;
}

class QueueConstruct extends Construct {
  readonly queue: Queue;
  readonly dlq: Queue;
  readonly handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: IQueueConstructProps) {
    super(scope, id);

    const {
      config,
      subscribeToTopic,
      queueVisibilityTimeout = Duration.minutes(2),
      deadLetterQueueMaxReceiveCount = 3,
    } = props;

    const serviceName = config.service.name;

    this.dlq = new Queue(this, "DeadLetterQueue", {
      queueName: `${serviceName}-dlq`,
      retentionPeriod: Duration.days(14),
      encryption: QueueEncryption.KMS_MANAGED,
    });

    const dlqConfig: DeadLetterQueue = {
      maxReceiveCount: deadLetterQueueMaxReceiveCount,
      queue: this.dlq,
    };

    const encryptionConfig = subscribeToTopic
      ? (() => {
          const key = new Key(this, "QueueKey", {
            enableKeyRotation: true,
            keyUsage: KeyUsage.ENCRYPT_DECRYPT,
          });

          key.addToResourcePolicy(
            new PolicyStatement({
              actions: ["kms:GenerateDataKey", "kms:Decrypt"],
              principals: [new ServicePrincipal("sns.amazonaws.com")],
              resources: ["*"],
            })
          );

          return {
            encryption: QueueEncryption.KMS,
            encryptionMasterKey: key,
          } as const;
        })()
      : {
          encryption: QueueEncryption.KMS_MANAGED,
        } as const;

    this.queue = new Queue(this, "Queue", {
      queueName: `${serviceName}-queue`,
      visibilityTimeout: queueVisibilityTimeout,
      deadLetterQueue: dlqConfig,
      ...encryptionConfig,
    });

    this.handler = new NodejsFunction(this, "QueueConsumer", {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.minutes(1),
      entry: path.join(__dirname, "./handler.ts"),
      handler: "handler",
      bundling: {
        externalModules: ["@aws-sdk"],
        forceDockerBundling: true,
      },
    });

    this.handler.addEventSource(
      new SqsEventSource(this.queue, {
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(10),
      })
    );

    if (subscribeToTopic) {
      subscribeToTopic.addSubscription(new SqsSubscription(this.queue));
    }
  }
}

export default QueueConstruct;

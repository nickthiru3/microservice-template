import { Construct } from "constructs";
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
  Metric,
} from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import type { IConfig } from "#config/default";

interface IS3FailureAlarmsConstructProps {
  readonly config: IConfig;
  readonly buckets: Bucket[];
}

class S3FailureAlarmsConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: IS3FailureAlarmsConstructProps
  ) {
    super(scope, id);

    const { config, buckets } = props;

    buckets.forEach((bucket, index) => {
      const bucketId = bucket.bucketName.replace(/[^A-Za-z0-9]/g, "") || `Bucket${index}`;

      const metric = new Metric({
        namespace: "AWS/S3",
        metricName: "4xxErrors",
        period: Duration.minutes(5),
        statistic: "Sum",
        dimensionsMap: {
          BucketName: bucket.bucketName,
          FilterId: "EntireBucket",
        },
      });

      new Alarm(this, `S3FailureAlarm${bucketId}`, {
        alarmName: `${config.service.name}-${bucket.bucketName}-S3Failures`,
        alarmDescription: `S3 bucket ${bucket.bucketName} is returning failures`,
        metric,
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      });
    });
  }
}

export default S3FailureAlarmsConstruct;

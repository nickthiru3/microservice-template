import { Construct } from "constructs";
import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
  Bucket,
  HttpMethods,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import type { IConfig } from "#config/default";

interface IStorageConstructProps {
  readonly config: IConfig;
}

class StorageConstruct extends Construct {
  public readonly s3Bucket: Bucket;

  constructor(scope: Construct, id: string, props: IStorageConstructProps) {
    super(scope, id);

    const { config } = props;

    const envName = config.envName;

    // Protect S3 in non-dev/non-local; allow easy cleanup in dev/local
    const shouldProtectFromDeletion = envName !== "local" && envName !== "dev";

    const allowedOrigins = [
      "https://your-production-domain.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    this.s3Bucket = new Bucket(this, "S3Bucket", {
      removalPolicy: shouldProtectFromDeletion
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      // Enable auto-delete only in dev/local so destroy works without manual cleanup
      autoDeleteObjects: !shouldProtectFromDeletion,
      cors: [
        {
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.HEAD,
            HttpMethods.PUT,
            HttpMethods.POST,
            HttpMethods.DELETE,
          ],
          allowedOrigins: allowedOrigins,
          allowedHeaders: ["*"],
          exposedHeaders: [
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2",
            "ETag",
          ],
          maxAge: 3000,
        },
      ],
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
    });

    new CfnOutput(this, "S3BucketName", {
      value: this.s3Bucket.bucketName,
      exportName: "S3BucketName",
      description: "Name of the S3 bucket",
    });

    new CfnOutput(this, "S3BucketArn", {
      value: this.s3Bucket.bucketArn,
      exportName: "S3BucketArn",
      description: "ARN of the S3 bucket",
    });
  }
}

export default StorageConstruct;

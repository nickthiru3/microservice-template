import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
  Bucket,
  HttpMethods,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";

interface StorageStackProps extends cdk.StackProps {
  envName: string;
}

class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // We can use envName for resource naming or other environment-specific configurations
    const { envName } = props;

    // Define allowed origins for CORS
    const allowedOrigins = [
      "https://your-production-domain.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    this.s3Bucket = new Bucket(this, "S3Bucket", {
      removalPolicy: RemovalPolicy.RETAIN, // Default to RETAIN for safety
      autoDeleteObjects: false, // Default to false for safety
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

    // Output the bucket name
    new CfnOutput(this, "S3BucketName", {
      value: this.s3Bucket.bucketName,
      exportName: "S3BucketName",
      description: "Name of the S3 bucket",
    });

    // Output the bucket ARN
    new CfnOutput(this, "S3BucketArn", {
      value: this.s3Bucket.bucketArn,
      exportName: "S3BucketArn",
      description: "ARN of the S3 bucket",
    });
  }
}

export default StorageStack;

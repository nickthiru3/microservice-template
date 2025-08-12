import { Construct } from "constructs";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import ResourceServerConstruct from "./resource-server/construct";
import OAuthConstruct from "./oauth/construct";
import IamConstruct from "../iam/construct";
import StorageConstruct from "../storage/construct";
import AuthConstruct from "../auth/construct";

interface PermissionsConstructProps {
  readonly iam: IamConstruct;
  readonly storage: StorageConstruct;
  readonly auth: AuthConstruct;
}

/**
 * Stack for managing identity-based permissions
 * Handles attaching policies to roles for accessing various resources
 */
class PermissionsConstruct extends Construct {
  public readonly oauth: OAuthConstruct;

  constructor(scope: Construct, id: string, props: PermissionsConstructProps) {
    super(scope, id);

    const { iam, storage, auth } = props;

    const resourceServer = new ResourceServerConstruct(this, "ResourceServer", {
      userPool: auth.userPool,
      envName: auth.envName,
    });

    // OAuth permissions integrated with existing UserPool
    this.oauth = new OAuthConstruct(this, "OAuthPermissions", {
      resourceServer,
    });

    // Create S3 access policy for merchants
    const merchantS3Policy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:PutObject"],
      resources: [`${storage.s3Bucket.bucketArn}/merchants/*`],
    });

    // Attach the policy only to the merchant role
    iam.roles.merchant.addToPolicy(merchantS3Policy);

    // Future permissions can be added here
    // For example:
    // - DynamoDB permissions
    // - SES permissions for email sending
    // - SNS permissions for notifications
    // etc.
  }
}

export default PermissionsConstruct;

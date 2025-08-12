import { Construct } from "constructs";
import DealsOAuthPermissionsConstruct from "./construct";
import * as cdk from "aws-cdk-lib";

interface OAuthPermissionsConstructProps {
  readonly auth: cdk.aws_cognito.UserPool;
}

/**
 * Main construct for managing OAuth permissions across different services
 * Acts as a container for service-specific permission constructs
 */
class OAuthPermissionsConstruct extends Construct {
  public readonly deals: DealsOAuthPermissionsConstruct;

  constructor(
    scope: Construct,
    id: string,
    props: OAuthPermissionsConstructProps
  ) {
    super(scope, id);

    const { auth } = props;

    // Deals permissions
    this.deals = new DealsOAuthPermissionsConstruct(this, "Deals", {
      resourceServer: auth.userPool.resourceServers.deals.resourceServer,
    });

    // Future service permissions can be added here
    // Example:
    // this.notifications = new NotificationsOAuthPermissionsConstruct(this, 'Notifications', {
    //   resourceServer: notificationsResourceServer,
    // });
  }
}

export default OAuthPermissionsConstruct;

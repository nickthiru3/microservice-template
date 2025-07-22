import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

class EndpointsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { lambda, http, merchantsResource, db } = props;

    const dealsResource = merchantsResource.addResource(
      "deals",
      http.optionsWithCors
    );

    // new CreateDealConstruct(this, "CreateDealConstruct", {
    //   lambda,
    //   http,
    //   dealsResource,
    //   db,
    // });

    // new DeleteConstruct(this, "DeleteConstruct", {
    //   lambda,
    //   dealsResource,
    // });
  }
}

export default EndpointsStack;

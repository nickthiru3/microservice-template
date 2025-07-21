import { Construct } from "constructs";

import CreateDealConstruct from "./create-deal/construct";
// const DeleteConstruct = require("./delete/construct");

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { lambda, http, merchantsResource, db } = props;

    const dealsResource = merchantsResource.addResource(
      "deals",
      http.optionsWithCors
    );

    new CreateDealConstruct(this, "CreateDealConstruct", {
      lambda,
      http,
      dealsResource,
      db,
    });

    // new DeleteConstruct(this, "DeleteConstruct", {
    //   lambda,
    //   dealsResource,
    // });
  }
}

export default EndpointsConstruct;

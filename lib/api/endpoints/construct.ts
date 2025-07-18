import { Construct } from "constructs";

import CreateConstruct from "./create-deal/construct";
// const DeleteConstruct = require("./delete/construct");

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { lambda, http, merchantsResource } = props;

    const dealsResource = merchantsResource.addResource(
      "deals",
      http.optionsWithCors
    );

    new CreateConstruct(this, "CreateConstruct", {
      lambda,
      http,
      dealsResource,
    });

    // new DeleteConstruct(this, "DeleteConstruct", {
    //   lambda,
    //   dealsResource,
    // });
  }
}

export default EndpointsConstruct;

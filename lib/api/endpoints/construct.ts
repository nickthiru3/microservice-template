import { Construct } from "constructs";
import DealsConstruct from "./deals/construct";

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    const { http, db } = props;

    new DealsConstruct(this, "DealsConstruct", {
      http,
      db,
    });

    // new DeleteConstruct(this, "DeleteConstruct", {
    //   lambda,
    //   dealsResource,
    // });
  }
}

export default EndpointsConstruct;

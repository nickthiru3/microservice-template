import { Construct } from "constructs";
import DealsConstruct from "./deals/construct";
import DbConstruct from "../db/construct";

interface EndpointsConstructProps {
  readonly http: any;
  readonly db: DbConstruct;
}

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EndpointsConstructProps) {
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

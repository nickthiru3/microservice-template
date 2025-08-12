import { Construct } from "constructs";
import PostConstruct from "./post/construct";
import DbConstruct from "../../db/construct";

interface DealsConstructProps {
  readonly http: any;
  readonly db: DbConstruct;
}

class DealsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DealsConstructProps) {
    super(scope, id);

    const { http, db } = props;

    const dealsResource = http.restApi.root.addResource(
      "deals",
      http.optionsWithCors
    );

    new PostConstruct(this, "PostConstruct", {
      http,
      db,
      dealsResource,
    });
  }
}

export default DealsConstruct;

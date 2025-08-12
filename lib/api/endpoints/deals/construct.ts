import { Construct } from "constructs";

import PostConstruct from "./post/construct";

class DealsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

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

import { Construct } from "constructs";

import CreateConstruct from "./create/construct";

class LambdaConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { db } = props;

    this.create = new CreateConstruct(this, "CreateConstruct", {
      db,
    });
  }
}

export default LambdaConstruct;

import { Construct } from "constructs";

class ServicesConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    const { envName, auth, db, sns, email } = props;
  }
}

export default ServicesConstruct;

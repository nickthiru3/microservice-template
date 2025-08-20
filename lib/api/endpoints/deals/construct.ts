import { Construct } from "constructs";
import ServicesConstruct from "../../../services/construct";
import PostConstruct from "./post/construct";

interface DealsConstructProps {
  readonly http: any;
  readonly services: ServicesConstruct;
}

class DealsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DealsConstructProps) {
    super(scope, id);

    const { http, services } = props;

    const dealsResource = http.restApi.root.addResource(
      "deals",
      http.optionsWithCors
    );

    new PostConstruct(this, "PostConstruct", {
      http,
      services,
      dealsResource,
    });
  }
}

export default DealsConstruct;

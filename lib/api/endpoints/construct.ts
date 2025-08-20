import { Construct } from "constructs";
import ServicesConstruct from "../../services/construct";
import DealsConstruct from "./deals/construct";
import BindingsEndpointsConstruct from "./bindings/construct";

interface EndpointsConstructProps {
  readonly http: any;
  readonly services: ServicesConstruct;
}

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EndpointsConstructProps) {
    super(scope, id);

    const { http, services } = props;

    new BindingsEndpointsConstruct(this, "BindingsEndpoints", {
      http,
      services,
    });

    new DealsConstruct(this, "DealsConstruct", { http, services });
  }
}

export default EndpointsConstruct;

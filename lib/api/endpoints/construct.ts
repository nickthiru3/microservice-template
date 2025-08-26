import { Construct } from "constructs";
import BindingsEndpointsConstruct from "./bindings/construct";
import DealsConstruct from "./deals/construct";
import ServicesConstruct from "#lib/services/construct";
import type { ApiProps } from "#lib/api/types";

interface EndpointsConstructProps {
  readonly api: ApiProps;
  readonly services: ServicesConstruct;
}

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EndpointsConstructProps) {
    super(scope, id);

    const { api, services } = props;

    new BindingsEndpointsConstruct(this, "BindingsEndpoints", {
      api,
      services,
    });

    new DealsConstruct(this, "DealsConstruct", { api, services });
  }
}

export default EndpointsConstruct;

import { Construct } from "constructs";
import PostConstruct from "./post/construct";
import ServicesConstruct from "#lib/services/construct";
import type { ApiProps } from "#lib/api/types";

interface DealsConstructProps {
  readonly api: ApiProps;
  readonly services: ServicesConstruct;
}

class DealsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DealsConstructProps) {
    super(scope, id);

    const { api, services } = props;

    const dealsResource = api.restApi.root.addResource(
      "deals",
      api.optionsWithCors
    );

    new PostConstruct(this, "PostConstruct", {
      api,
      services,
      dealsResource,
    });
  }
}

export default DealsConstruct;

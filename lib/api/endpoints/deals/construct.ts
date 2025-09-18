import { Construct } from "constructs";
import PostConstruct from "./post/construct";
import type { IApiProps } from "#lib/api/construct";
import DatabaseConstruct from "#lib/db/construct";

interface IDealsConstructProps {
  readonly apiProps: IApiProps;
  readonly db: DatabaseConstruct;
}

class DealsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IDealsConstructProps) {
    super(scope, id);

    const { apiProps, db } = props;

    const dealsResource = apiProps.restApi.root.addResource(
      "deals",
      apiProps.optionsWithCors
    );

    new PostConstruct(this, "PostConstruct", {
      apiProps,
      db,
      dealsResource,
    });
  }
}

export default DealsConstruct;

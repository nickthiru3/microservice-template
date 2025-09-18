import { Construct } from "constructs";
import BindingsConstruct from "./bindings/construct";
import DealsConstruct from "./deals/construct";
import DatabaseConstruct from "#lib/db/construct";
import type { IApiProps } from "#lib/api/construct";
import type { IConfig } from "#config/default";

interface IEndpointsConstructProps {
  readonly config: IConfig;
  readonly apiProps: IApiProps;
  readonly db: DatabaseConstruct;
}

class EndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IEndpointsConstructProps) {
    super(scope, id);

    const { config, apiProps, db } = props;

    new BindingsConstruct(this, "BindingsConstruct", {
      config,
      apiProps,
    });

    new DealsConstruct(this, "DealsConstruct", {
      apiProps,
      db,
    });
  }
}

export default EndpointsConstruct;

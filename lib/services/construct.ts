import { Construct } from "constructs";
import CreateDealConstruct from "./create-deal/construct";
import ServicesDiscoveryConstruct from "./services-discovery/construct";
import DbConstruct from "#lib/db/construct";

interface ServicesConstructProps {
  readonly envName: string;
  readonly db: DbConstruct;
}

class ServicesConstruct extends Construct {
  createDeal: CreateDealConstruct;
  servicesDiscovery: ServicesDiscoveryConstruct;

  constructor(scope: Construct, id: string, props: ServicesConstructProps) {
    super(scope, id);

    const { envName, db } = props;

    this.createDeal = new CreateDealConstruct(this, "CreateDealConstruct", {
      db,
    });

    this.servicesDiscovery = new ServicesDiscoveryConstruct(
      this,
      "ServicesDiscoveryConstruct",
      {
        envName,
        ssmPublicPath: `/super-deals/${envName}/deals-ms/public`,
      }
    );
  }
}

export default ServicesConstruct;

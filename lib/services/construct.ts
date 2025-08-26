import { Construct } from "constructs";
import CreateDealConstruct from "./create-deal/construct";
import ServicesDiscoveryConstruct from "./services-discovery/construct";
import DbConstruct from "#lib/db/construct";
import { buildSsmPublicPath } from "#src/helpers/ssm";

interface ServicesConstructProps {
  readonly envName: string;
  readonly db: DbConstruct;
  readonly region: string;
}

class ServicesConstruct extends Construct {
  createDeal: CreateDealConstruct;
  servicesDiscovery: ServicesDiscoveryConstruct;

  constructor(scope: Construct, id: string, props: ServicesConstructProps) {
    super(scope, id);

    const { envName, db, region } = props;

    // Build standardized SSM public path via helper
    const ssmPublicPath = buildSsmPublicPath(envName);

    this.createDeal = new CreateDealConstruct(this, "CreateDealConstruct", {
      db,
    });

    this.servicesDiscovery = new ServicesDiscoveryConstruct(
      this,
      "ServicesDiscoveryConstruct",
      {
        envName,
        ssmPublicPath,
        region,
      }
    );
  }
}

export default ServicesConstruct;

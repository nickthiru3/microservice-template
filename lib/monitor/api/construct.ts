import { Construct } from "constructs";
import Alarm4xxConstruct from "./4xx/construct";

interface ApiMonitoringConstructProps {
  readonly envName: string;
}

class ApiMonitoringConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ApiMonitoringConstructProps
  ) {
    super(scope, id);

    const { envName } = props;

    new Alarm4xxConstruct(this, "Alarm4xxConstruct", { envName });
  }
}

export default ApiMonitoringConstruct;

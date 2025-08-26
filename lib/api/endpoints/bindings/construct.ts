import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import ServicesConstruct from "#lib/services/construct";
import type { ApiProps } from "#lib/api/types";

interface BindingsEndpointsProps {
  readonly api: ApiProps;
  readonly services: ServicesConstruct;
}

class BindingsEndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: BindingsEndpointsProps) {
    super(scope, id);

    const { api, services } = props;

    const wk = api.restApi.root.addResource(".well-known", api.optionsWithCors);
    const bindings = wk.addResource("bindings", api.optionsWithCors);

    bindings.addMethod(
      "GET",
      new LambdaIntegration(services.servicesDiscovery.lambda),
      {
        operationName: "ServiceDiscovery_Bindings",
      }
    );
  }
}

export default BindingsEndpointsConstruct;

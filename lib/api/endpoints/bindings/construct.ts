import { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import ServicesConstruct from "../../../services/construct";

interface BindingsEndpointsProps {
  readonly http: { restApi: RestApi; optionsWithCors?: any };
  readonly services: ServicesConstruct;
}

class BindingsEndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: BindingsEndpointsProps) {
    super(scope, id);

    const { http, services } = props;

    const wk = http.restApi.root.addResource(".well-known", http.optionsWithCors);
    const bindings = wk.addResource("bindings", http.optionsWithCors);

    bindings.addMethod("GET", new LambdaIntegration(services.servicesDiscovery.lambda), {
      operationName: "ServiceDiscovery_Bindings",
    });
  }
}

export default BindingsEndpointsConstruct;

import type { RestApi, ResourceOptions } from "aws-cdk-lib/aws-apigateway";
import type AuthorizationConstruct from "./authorization/construct";

// Shared API props shape passed down to endpoint constructs
export type CorsOnlyResourceOptions = Pick<
  ResourceOptions,
  "defaultCorsPreflightOptions"
>;

export interface ApiProps {
  restApi: RestApi;
  optionsWithCors: CorsOnlyResourceOptions;
  // Full set of authorization options from AuthorizationConstruct
  optionsWithAuth: AuthorizationConstruct["authOptions"];
}

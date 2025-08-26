import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Model, RequestValidator, IResource } from "aws-cdk-lib/aws-apigateway";
import ServicesConstruct from "#lib/services/construct";
import type { ApiProps } from "#lib/api/types";

import schema from "./schema";
interface PostConstructProps {
  readonly api: ApiProps;
  readonly services: ServicesConstruct;
  readonly dealsResource: IResource;
}

class PostConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PostConstructProps) {
    super(scope, id);

    const { api, services, dealsResource } = props;

    const model = new Model(this, `Model`, {
      restApi: api.restApi,
      contentType: "application/json",
      description: "Validation model for create deals form",
      schema,
    });

    const requestValidator = new RequestValidator(this, `RequestValidator`, {
      restApi: api.restApi,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    dealsResource.addMethod(
      "POST",
      new LambdaIntegration(services.createDeal.lambda),
      {
        operationName: "CreateDeal",
        requestValidator,
        requestModels: {
          "application/json": model,
        },
        ...api.optionsWithAuth.deals.writeDealsAuth, // Use write scope for deal creation
      }
    );
  }
}

export default PostConstruct;

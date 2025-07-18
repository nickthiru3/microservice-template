import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Model, RequestValidator } from "aws-cdk-lib/aws-apigateway";

import schema from "./schema";

class CreateConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id, props);

    const { lambda, http, dealsResource } = props;

    const model = new Model(this, `Model`, {
      restApi: http.restApi,
      contentType: "application/json",
      description: "Validation model for create deals form",
      schema,
    });

    const requestValidator = new RequestValidator(this, `RequestValidator`, {
      restApi: http.restApi,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    dealsResource.addMethod(
      "POST",
      new LambdaIntegration(lambda.merchants.deals.create.lambda),
      {
        operationName: "CreateDeal",
        requestValidator,
        requestModels: {
          "application/json": model,
        },
        ...http.optionsWithAuth.writeDealsAuth, // Use write scope for deal creation
      }
    );
  }
}

export default CreateConstruct;

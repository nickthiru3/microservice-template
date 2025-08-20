import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Model, RequestValidator } from "aws-cdk-lib/aws-apigateway";
import ServicesConstruct from "../../../../services/construct";

import schema from "./schema";
interface PostConstructProps {
  readonly http: any;
  readonly services: ServicesConstruct;
  readonly dealsResource: any;
}

class PostConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PostConstructProps) {
    super(scope, id);

    const { http, services, dealsResource } = props;

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
      new LambdaIntegration(services.createDeal.lambda),
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

export default PostConstruct;

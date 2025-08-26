import { Construct } from "constructs";
import { Role, IRole } from "aws-cdk-lib/aws-iam";
import { z } from "zod";
import {
  getBasePath,
  readParamOptional,
  readParamRequired,
} from "#src/helpers/ssm";
import type { IamBindings } from "@super-deals/infra-contracts";

interface IamBindingsConstructProps {
  readonly envName: string;
}

class IamBindingsConstruct extends Construct {
  public readonly roles: {
    merchant: IRole;
    authenticated?: IRole;
    unauthenticated?: IRole;
  };

  constructor(scope: Construct, id: string, props: IamBindingsConstructProps) {
    super(scope, id);

    const { envName } = props;
    const basePath = getBasePath(envName);
    const merchantRoleArn = readParamRequired(
      this,
      `${basePath}/iam/roles/merchant/arn`
    );
    const authenticatedRoleArn = readParamOptional(
      this,
      `${basePath}/iam/roles/authenticated/arn`
    );
    const unauthenticatedRoleArn = readParamOptional(
      this,
      `${basePath}/iam/roles/unauthenticated/arn`
    );

    // Validate bindings
    const IamBindingsSchema = z.object({
      merchantRoleArn: z.string().min(1, "merchantRoleArn missing"),
      authenticatedRoleArn: z.string().min(1).optional(),
      unauthenticatedRoleArn: z.string().min(1).optional(),
    });
    const iamB: IamBindings = IamBindingsSchema.parse({
      merchantRoleArn,
      authenticatedRoleArn,
      unauthenticatedRoleArn,
    });

    this.roles = {
      merchant: Role.fromRoleArn(
        this,
        "ImportedMerchantRole",
        iamB.merchantRoleArn
      ),
      ...(iamB.authenticatedRoleArn && {
        authenticated: Role.fromRoleArn(
          this,
          "ImportedAuthenticatedRole",
          iamB.authenticatedRoleArn
        ),
      }),
      ...(iamB.unauthenticatedRoleArn && {
        unauthenticated: Role.fromRoleArn(
          this,
          "ImportedUnauthenticatedRole",
          iamB.unauthenticatedRoleArn
        ),
      }),
    } as any;
  }
}

export default IamBindingsConstruct;

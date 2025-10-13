import { ResourceServerScope } from "aws-cdk-lib/aws-cognito";
import ResourceServerConstruct from "#lib/permissions/resource-server/construct";
import {
  createMockUserPoolIds,
  createTestStack,
} from "#test/support/lib/permissions-test-helpers";

const config = {
  service: {
    name: "resource",
    displayName: "Resource",
  },
} as any;

describe("lib/permissions/resource-server/construct", () => {
  let stack: ReturnType<typeof createTestStack>;
  let ssmBindings: {
    auth: { userPool: ReturnType<typeof createMockUserPoolIds> };
  };

  beforeEach(() => {
    stack = createTestStack();
    ssmBindings = {
      auth: {
        userPool: createMockUserPoolIds(),
      },
    };
  });

  test("creates scopes for CRUD operations", () => {
    const construct = new ResourceServerConstruct(stack, "ResourceServer", {
      ssmBindings: ssmBindings as any,
      config,
    });

    const scopeNames = construct.scopes.map(
      (scope: ResourceServerScope) => scope.scopeName
    );

    expect(scopeNames).toEqual(["read", "write", "delete"]);
  });

  test("builds slash-separated scopes using identifier", () => {
    const construct = new ResourceServerConstruct(
      stack,
      "ResourceServerScopes",
      {
        ssmBindings: ssmBindings as any,
        config,
      }
    );

    construct.identifier = "resource";

    expect(construct.getOAuthScopes()).toEqual([
      "resource/read",
      "resource/write",
      "resource/delete",
    ]);
  });
});

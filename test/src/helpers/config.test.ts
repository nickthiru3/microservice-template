import { makeEnv, makeTags, makeDescription } from "#src/helpers/config";

describe("src/helpers/config", () => {
  const cfg = {
    region: "us-east-1",
    accountId: "123456789012",
    service: { name: "resource-ms", displayName: "Resource Service" },
  } as any;

  test("makeEnv returns local defaults when env is local", () => {
    const out = makeEnv("local", cfg);
    expect(out).toEqual({ account: "000000000000", region: "us-east-1" });
  });

  test("makeEnv returns configured account/region otherwise", () => {
    const out = makeEnv("dev", cfg);
    expect(out).toEqual({ account: "123456789012", region: "us-east-1" });
  });

  test("makeTags composes standard tags", () => {
    const tags = makeTags("dev", cfg, "ServiceStack");
    expect(tags).toMatchObject({
      Environment: "dev",
      Service: "resource-ms",
      ServiceDisplayName: "Resource Service",
      StackType: "ServiceStack",
    });
  });

  test("makeDescription formats description", () => {
    expect(makeDescription("dev", "Service Stack")).toBe(
      "Microservice Service Stack (dev)"
    );
  });
});

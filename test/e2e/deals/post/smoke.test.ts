import request from "supertest";
import { getApiBaseUrlFromOutputs } from "#test/support/e2e/get-api-url.js";
import { getBearerTokenIfAvailable } from "#test/support/e2e/token-cache.js";
import { getDefaultProfile } from "#test/support/e2e/e2e-config.js";

// Prefer outputs.json; allow explicit override via TEST_API_URL only if provided (for emergencies)
const resolvedApiUrl = getApiBaseUrlFromOutputs() || process.env.TEST_API_URL;
const defaultProfile = getDefaultProfile();
const bearer = getBearerTokenIfAvailable(defaultProfile);

const preconditionsOk = Boolean(resolvedApiUrl && bearer);
const maybeDescribe = preconditionsOk ? describe : describe.skip;

maybeDescribe("E2E: POST /deals", () => {
  const client = request(resolvedApiUrl!);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

  test("returns 200 with dealId on valid payload", async () => {
    const body = {
      userId: "e2e-user",
      title: `E2E Deal ${Date.now()}`,
      originalPrice: 123.45,
      discount: 15,
      logoFileKey: "e2e-logo.png",
      category: "tech",
      expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const res = await client.post("/deals").set(headers).send(body);
    expect([200, 201]).toContain(res.status); // allow 201 if service prefers Created later
    expect(res.body).toHaveProperty("dealId");
    expect(typeof res.body.dealId).toBe("string");
  }, 20000);

  test("returns 400 on invalid payload (missing title)", async () => {
    const bad = {
      userId: "e2e-user",
      // title missing
      originalPrice: 123.45,
      discount: 15,
      logoFileKey: "e2e-logo.png",
      category: "tech",
      expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    const res = await client.post("/deals").set(headers).send(bad);
    expect(res.status).toBe(400);
  }, 15000);
});

if (!resolvedApiUrl || !bearer) {
  // eslint-disable-next-line no-console
  console.warn(
    "[E2E] Skipping E2E tests: missing API URL or bearer token. Ensure outputs.json is present and .e2e/token.<profile>.json exists with { token, expiresAt }, and optionally set defaultProfile in .e2e/e2e.config.json."
  );
}

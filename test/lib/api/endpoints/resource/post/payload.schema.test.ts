import { resourcePayloadSchema, categoryEnum } from "#lib/api/endpoints/resource/post/payload.schema";

describe("resourcePayloadSchema", () => {
  test("accepts a valid payload (with numeric coercions)", () => {
    const payload = {
      userId: "user-1",
      title: "My Resource",
      originalPrice: "100", // coerced to number
      discount: "15", // coerced to number
      logoFileKey: "logo.png",
      category: categoryEnum[0],
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const res = resourcePayloadSchema.safeParse(payload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(typeof res.data.originalPrice).toBe("number");
      expect(typeof res.data.discount).toBe("number");
    }
  });

  test("rejects invalid ISO date-time", () => {
    const payload = {
      userId: "user-1",
      title: "My Resource",
      originalPrice: 100,
      discount: 10,
      logoFileKey: "logo.png",
      category: categoryEnum[0],
      expiration: "not-a-date",
    };

    const res = resourcePayloadSchema.safeParse(payload);
    expect(res.success).toBe(false);
    if (!res.success) {
      // Ensure specific error message set in refine()
      const flat = res.error.flatten();
      expect(flat.fieldErrors.expiration?.[0]).toMatch(/Invalid ISO 8601/);
    }
  });

  test("rejects when required fields are missing", () => {
    const payload = {
      // userId missing
      title: "My Resource",
      originalPrice: 100,
      discount: 10,
      logoFileKey: "logo.png",
      category: categoryEnum[0],
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    const res = resourcePayloadSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  test("rejects category not in enum", () => {
    const payload = {
      userId: "user-1",
      title: "My Resource",
      originalPrice: 100,
      discount: 10,
      logoFileKey: "logo.png",
      category: "wrong" as any,
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const res = resourcePayloadSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });
});

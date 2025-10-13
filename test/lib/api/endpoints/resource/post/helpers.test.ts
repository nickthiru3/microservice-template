import type { APIGatewayProxyEvent } from "aws-lambda";

const sendMock = jest.fn();
const randomSyncMock = jest.fn(() => ({ string: "KSUID_TEST_VALUE" }));

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    __esModule: true,
    DynamoDBClient: jest.fn().mockImplementation(() => ({ send: sendMock })),
    PutItemCommand: class PutItemCommand {
      constructor(public readonly input: any) {}
    },
  };
});

jest.mock("ksuid", () => ({
  __esModule: true,
  default: {
    randomSync: randomSyncMock,
  },
}));

let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

import {
  parseAndValidateBody,
  normalizeData,
  validateData,
  buildResourceItem,
  getRequiredEnv,
  generateResourceId,
  prepareSuccessResponse,
  prepareErrorResponse,
  logEventReceived,
  saveResourceToDynamoDB,
} from "#lib/api/endpoints/resource/post/helpers";
import {
  categoryEnum,
  type TCreateResourcePayload,
} from "#lib/api/endpoints/resource/post/payload.schema";

function makeEventBody(body: any): APIGatewayProxyEvent {
  return {
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/resource",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: "/resource",
    requestContext: {} as any,
  };
}

// ----------------------
// parseAndValidateBody
// ----------------------

describe("helpers.parseAndValidateBody", () => {
  const valid = {
    userId: "user-1",
    title: "A Resource",
    originalPrice: 100,
    discount: 15,
    logoFileKey: "logo.png",
    category: categoryEnum[0],
    expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
  };

  test("ok=true for valid payload", () => {
    const res = parseAndValidateBody(makeEventBody(valid));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.title).toBe("A Resource");
    }
  });

  test("400 when body missing", () => {
    const event = makeEventBody(valid);
    (event as any).body = undefined;
    const res = parseAndValidateBody(event);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.statusCode).toBe(400);
      expect(JSON.parse(res.response.body).error).toMatch(
        /Invalid request body/
      );
    }
  });

  test("400 when invalid JSON", () => {
    const res = parseAndValidateBody(makeEventBody("{oops"));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.statusCode).toBe(400);
      expect(JSON.parse(res.response.body).error).toMatch(/Invalid JSON/);
    }
  });

  test("400 when schema invalid", () => {
    const bad = { ...valid, title: "" };
    const res = parseAndValidateBody(makeEventBody(bad));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.statusCode).toBe(400);
      const body = JSON.parse(res.response.body);
      expect(body.error).toMatch(/Invalid request body/);
      expect(body.details).toBeDefined();
    }
  });
});

// -------------
// normalizeData
// -------------

describe("helpers.normalizeData", () => {
  test("trims title and logoFileKey", () => {
    const input: TCreateResourcePayload = {
      userId: "u1",
      title: "  Hello  ",
      originalPrice: 100,
      discount: 5,
      logoFileKey: "  file.png  ",
      category: categoryEnum[0],
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    const out = normalizeData(input);
    expect(out.title).toBe("Hello");
    expect(out.logoFileKey).toBe("file.png");
    expect(out.originalPrice).toBe(100);
    expect(out.discount).toBe(5);
  });
});

// ------------
// validateData
// ------------

describe("helpers.validateData", () => {
  function makeBase(): TCreateResourcePayload {
    return {
      userId: "u1",
      title: "Hello",
      originalPrice: 100,
      discount: 5,
      logoFileKey: "file.png",
      category: categoryEnum[0],
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
  }

  test("throws when expiration < 7 days from today", () => {
    const payload = makeBase();
    payload.expiration = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(() => validateData(payload)).toThrow(
      /expiration must be at least 7 days from today/
    );
  });

  test("does not throw when expiration >= 7 days", () => {
    const payload = makeBase();
    expect(() => validateData(payload)).not.toThrow();
  });
});

// --------------
// buildResourceItem
// --------------

describe("helpers.buildResourceItem", () => {
  test("produces correct keys and coercions", () => {
    const payload: TCreateResourcePayload = {
      userId: "u1",
      title: "Hello",
      originalPrice: 100 as any,
      discount: 5 as any,
      logoFileKey: "file.png",
      category: categoryEnum[0],
      expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    const id = "ABC123";
    const item = buildResourceItem(payload, id);

    expect(item.PK).toBe(`RESOURCE#${id}`);
    expect(item.SK).toBe(`RESOURCE#${id}`);
    expect(item.EntityType).toBe("Resource");
    expect(item.Id).toBe(id);
    expect(item.Title).toBe("Hello");
    expect(item.OriginalPrice).toBe(100);
    expect(item.Discount).toBe(5);
    expect(item.Category).toBe(categoryEnum[0]);
    expect(item.Expiration).toBe(payload.expiration);
    expect(item.MerchantId).toBe("u1");
    expect(item.LogoFileKey).toBe("file.png");
    expect(typeof item.CreatedAt).toBe("string");
  });
});

// ----------------
// getRequiredEnv
// ----------------

describe("helpers.getRequiredEnv", () => {
  afterEach(() => {
    delete (process as any).env.TABLE_NAME;
  });

  test("returns ok with tableName when env is set", () => {
    process.env.TABLE_NAME = "ResourceTable";
    const res = getRequiredEnv();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.tableName).toBe("ResourceTable");
    }
  });

  test("returns 500 response when TABLE_NAME missing", () => {
    const res = getRequiredEnv();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.statusCode).toBe(500);
      expect(JSON.parse(res.response.body).error).toMatch(
        /TABLE_NAME env var not set/
      );
    }
  });
});

describe("helpers.generateResourceId", () => {
  test("delegates to KSUID generator", () => {
    const id = generateResourceId();
    expect(randomSyncMock).toHaveBeenCalledTimes(1);
    expect(id).toBe("KSUID_TEST_VALUE");
  });
});

describe("helpers.prepareSuccessResponse", () => {
  test("returns API success payload with resource id", () => {
    const response = prepareSuccessResponse("RESOURCE123");
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      message: "Resource successfully created",
      resourceId: "RESOURCE123",
    });
  });
});

describe("helpers.prepareErrorResponse", () => {
  test("reuses error message when available", () => {
    const response = prepareErrorResponse(new Error("boom"));
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("boom");
    expect(body.details?.message).toBe("boom");
  });

  test("falls back to default message when missing", () => {
    const response = prepareErrorResponse({});
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Failed to create resource");
  });

  test("uses status/message/details from custom error", () => {
    const response = prepareErrorResponse({
      statusCode: 418,
      message: "Teapot",
      details: { info: "short" },
    });
    expect(response.statusCode).toBe(418);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Teapot");
    expect(body.details).toEqual({ info: "short" });
  });
});

describe("helpers.logEventReceived", () => {
  test("logs event payload", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const event = makeEventBody({ hello: "world" });
    logEventReceived(event);
    expect(spy).toHaveBeenCalledWith(
      "Received event:",
      JSON.stringify(event, null, 2)
    );
    spy.mockRestore();
  });
});

describe("helpers.saveResourceToDynamoDB", () => {
  const payload: TCreateResourcePayload = {
    userId: "merchant-1",
    title: "Resource",
    originalPrice: 100,
    discount: 25,
    logoFileKey: "logo.png",
    category: categoryEnum[0],
    expiration: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
  } as any;

  const item = buildResourceItem(payload, "RESOURCE123");

  afterEach(() => {
    sendMock.mockReset();
  });

  test("returns ok when DynamoDB write succeeds", async () => {
    sendMock.mockResolvedValueOnce({});

    const result = await saveResourceToDynamoDB("ResourceTable", item);

    expect(result.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0] as any;
    expect(command.input.TableName).toBe("ResourceTable");
    expect(command.input.ConditionExpression).toContain("attribute_not_exists");
  });

  test("returns 409 when item already exists", async () => {
    sendMock.mockRejectedValueOnce({
      name: "ConditionalCheckFailedException",
    });

    const result = await saveResourceToDynamoDB("ResourceTable", item);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.statusCode).toBe(409);
    }
  });

  test("returns 502 when DynamoDB fails", async () => {
    sendMock.mockRejectedValueOnce({ message: "boom" });

    const result = await saveResourceToDynamoDB("ResourceTable", item);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.statusCode).toBe(502);
      const body = JSON.parse(result.response.body);
      expect(body.details).toEqual({ message: "boom" });
    }
  });
});

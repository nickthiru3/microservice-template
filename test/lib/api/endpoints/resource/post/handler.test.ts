import { APIGatewayProxyEvent } from "aws-lambda";

// Hoisted mocks BEFORE importing the handler
const sendMock = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    __esModule: true,
    DynamoDBClient: jest.fn().mockImplementation(() => ({ send: sendMock })),
    PutItemCommand: class PutItemCommand {
      constructor(public readonly _input: any) {}
    },
  };
});

jest.mock("ksuid", () => ({
  __esModule: true,
  default: {
    randomSync: () => ({ string: "TEST_RESOURCE_ID_123" }),
  },
}));

import { handler } from "#lib/api/endpoints/resource/post/handler";

function makeEvent(body: any): APIGatewayProxyEvent {
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

const validBody = {
  userId: "user-1",
  title: " Test Resource ",
  originalPrice: 100,
  discount: 10,
  logoFileKey: " logo.png ",
  category: "tech",
  // 10 days from now
  expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
};

describe("POST /resource handler (behavior)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.TABLE_NAME = "ResourceTable";
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
  });

  test("returns 200 on success with generated resourceId", async () => {
    sendMock.mockResolvedValueOnce({});

    const res = await handler(makeEvent(validBody));

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toMatchObject({
      message: "Resource successfully created",
      resourceId: "TEST_RESOURCE_ID_123",
    });
  });

  test("returns 409 when item already exists (conditional check)", async () => {
    sendMock.mockRejectedValueOnce({ name: "ConditionalCheckFailedException" });

    const res = await handler(makeEvent(validBody));

    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error).toBe("Resource already exists");
  });

  test("returns 502 on DynamoDB error", async () => {
    sendMock.mockRejectedValueOnce({ message: "boom" });

    const res = await handler(makeEvent(validBody));

    expect(res.statusCode).toBe(502);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("Error saving resource");
    expect(body.details?.message).toBe("boom");
  });

  test("returns 500 when TABLE_NAME is missing", async () => {
    delete process.env.TABLE_NAME;

    const res = await handler(makeEvent(validBody));

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("TABLE_NAME env var not set");
  });

  test("returns 400 on invalid JSON", async () => {
    const res = await handler(makeEvent("{not-json"));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("Invalid JSON in request body");
  });

  test("returns 400 when body is missing", async () => {
    const event = makeEvent(validBody);
    event.body = undefined as any;

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe(
      "Invalid request body: body is required"
    );
  });

  test("returns 400 on schema validation error", async () => {
    const bad = { ...validBody, title: "" };

    const res = await handler(makeEvent(bad));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("Invalid request body");
  });
});

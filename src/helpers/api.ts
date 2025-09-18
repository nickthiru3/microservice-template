// Consolidated API helpers
// Exports: apiSuccess, apiError
// Internal: addCorsHeader

export type TApiResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function addCorsHeader(): Record<string, string> {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };
}

export function apiSuccess<T>(data: T, statusCode: number = 200): TApiResponse {
  const headers = addCorsHeader();
  const response: TApiResponse = {
    statusCode,
    headers,
    body: JSON.stringify(data),
  };
  return response;
}

export function apiError(
  statusCode: number,
  message: string,
  details?: unknown
): TApiResponse {
  const headers = addCorsHeader();
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  const response: TApiResponse = {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
  console.log(`Error Response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

// Converts unknown errors into a shallow, JSON-serializable object
export function serializeErr(err: unknown): Record<string, unknown> {
  const e = err as any;
  const out: Record<string, unknown> = {};
  if (e?.name) out.name = e.name;
  if (e?.message) out.message = e.message;
  if (e?.code) out.code = e.code;
  if (e?.$metadata) out.$metadata = e.$metadata;
  // Avoid logging full stack traces to API consumers; keep minimal
  return out;
}

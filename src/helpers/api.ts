// Consolidated API helpers
// Exports: success, error
// Internal: addCorsHeader

export type ApiResponse = {
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

export function success<T>(data: T, statusCode: number = 200): ApiResponse {
  const headers = addCorsHeader();
  const response: ApiResponse = {
    statusCode,
    headers,
    body: JSON.stringify(data),
  };
  return response;
}

export function error(
  statusCode: number,
  message: string,
  details?: unknown
): ApiResponse {
  const headers = addCorsHeader();
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  const response: ApiResponse = {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
  console.log(`Error Response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

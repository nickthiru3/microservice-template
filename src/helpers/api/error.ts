import addCorsHeader from "./add-cors-header";

function error(statusCode, message, details = null) {
  const headers = addCorsHeader();
  const body = {
    error: message,
  };
  if (details) {
    body.details = details;
  }
  const response = {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
  console.log(`Error Response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

export default error;

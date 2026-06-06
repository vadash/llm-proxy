export const PASSTHROUGH_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "x-api-key",
  "anthropic-version",
] as const;

export function filterPassthroughHeaders(source: Headers): Headers {
  const out = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = source.get(name);
    if (value) out.set(name, value);
  }
  return out;
}

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS },
  });
}

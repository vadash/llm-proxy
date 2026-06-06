import { generateFakeIp } from "./fake-ip";
import { CORS_HEADERS, errorResponse, filterPassthroughHeaders } from "./http";

export async function handleProxyRequest(
  request: Request,
  env: { INTERNAL_AUTH_SECRET: string; PROXY_INDEX: string },
  _ctx: ExecutionContext,
): Promise<Response> {
  const authHeader = request.headers.get("X-Internal-Auth");
  if (authHeader !== env.INTERNAL_AUTH_SECRET) {
    return errorResponse("Unauthorized", 401);
  }

  const targetUrl = request.headers.get("X-Target-URL");
  if (!targetUrl) {
    return errorResponse("Missing X-Target-URL header", 400);
  }

  const method = request.headers.get("X-Original-Method") ?? "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const url = new URL(targetUrl);
  const domain = url.hostname;

  const proxyIndex = Number(env.PROXY_INDEX);
  const fakeIp = await generateFakeIp(proxyIndex, domain);

  const upstreamHeaders = filterPassthroughHeaders(request.headers);
  upstreamHeaders.set("Host", domain);
  upstreamHeaders.set("X-Forwarded-For", fakeIp);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    return errorResponse("Upstream request failed", 502);
  }
}

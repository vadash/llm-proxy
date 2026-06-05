import { describe, it, expect, vi, afterEach } from "vitest";
import { handleRouterRequest } from "../../src/router";
import { handleProxyRequest } from "../../src/proxy";
import { encodeBase64Url } from "../../src/base64url";

const AUTH_KEY = "testpass";
const INTERNAL_AUTH_SECRET = "testpass";

describe("full request pipeline integration", () => {
  let upstreamCaptured: {
    url: string;
    method: string;
    headers: Headers;
    body: string | undefined;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes client request through router to proxy to upstream end-to-end", async () => {
    const upstreamBody = JSON.stringify({
      id: "chatcmpl-test",
      choices: [{ message: { content: "Hello!" } }],
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        upstreamCaptured = {
          url: input as string,
          method: init?.method ?? "GET",
          headers: init?.headers as Headers,
          body: init?.body as string | undefined,
        };
        return new Response(upstreamBody, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

    const createProxyFetcher = (proxyIndex: string) => ({
      fetch: (req: Request) =>
        handleProxyRequest(
          req,
          { INTERNAL_AUTH_SECRET, PROXY_INDEX: proxyIndex },
          {} as ExecutionContext,
        ),
    });

    const routerEnv = {
      AUTH_KEY,
      INTERNAL_AUTH_SECRET,
      PROXY_COUNT: "2",
      PROXY_1: createProxyFetcher("1"),
      PROXY_2: createProxyFetcher("2"),
    };

    const encodedUrl = encodeBase64Url("https://api.openai.com/v1");
    const clientBody = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Say hello" }],
    });

    const clientRequest = new Request(
      `http://localhost/${AUTH_KEY}/0/${encodedUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer sk-test-api-key",
          "Content-Type": "application/json",
          Accept: "application/json",
          "CF-Connecting-IP": "203.0.113.1",
          "CF-RAY": "test-ray-id",
          "CF-Visitor": '{"scheme":"https"}',
          "CF-IPCountry": "US",
          "X-Real-IP": "203.0.113.1",
        },
        body: clientBody,
      },
    );

    const response = await handleRouterRequest(
      clientRequest,
      routerEnv,
      {} as ExecutionContext,
    );

    expect(upstreamCaptured!.url).toBe(
      "https://api.openai.com/v1/chat/completions",
    );

    expect(upstreamCaptured!.headers.get("Authorization")).toBe(
      "Bearer sk-test-api-key",
    );

    const xff = upstreamCaptured!.headers.get("X-Forwarded-For");
    expect(xff).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

    const cfHeaders = [...upstreamCaptured!.headers.keys()].filter((k) =>
      k.toLowerCase().startsWith("cf-"),
    );
    expect(cfHeaders).toEqual([]);

    expect(upstreamCaptured!.body).toBe(clientBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "chatcmpl-test",
      choices: [{ message: { content: "Hello!" } }],
    });

    const secondRequest = new Request(
      `http://localhost/${AUTH_KEY}/0/${encodedUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer sk-test-api-key",
          "Content-Type": "application/json",
        },
        body: clientBody,
      },
    );

    await handleRouterRequest(
      secondRequest,
      routerEnv,
      {} as ExecutionContext,
    );

    const xff2 = upstreamCaptured!.headers.get("X-Forwarded-For");
    expect(xff2).toBe(xff);

    fetchSpy.mockRestore();
  });
});

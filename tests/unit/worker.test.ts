import { describe, it, expect, vi } from "vitest";

describe("worker entry point", () => {
  const mockCtx = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext;

  async function importWorker() {
    vi.resetModules();
    vi.doMock("../../src/router", () => ({
      handleRouterRequest: vi.fn(() => new Response("router-ok")),
    }));
    vi.doMock("../../src/proxy", () => ({
      handleProxyRequest: vi.fn(() => new Response("proxy-ok")),
    }));
    return import("../../src/worker");
  }

  it("delegates to handleRouterRequest when WORKER_ROLE=router", async () => {
    const mod = await importWorker();
    const worker = mod.default;
    const env = { WORKER_ROLE: "router" };
    const request = new Request("http://localhost/test");

    const response = await worker.fetch(request, env, mockCtx);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("router-ok");
  });

  it("delegates to handleProxyRequest when WORKER_ROLE=proxy", async () => {
    const mod = await importWorker();
    const worker = mod.default;
    const env = { WORKER_ROLE: "proxy" };
    const request = new Request("http://localhost/test");

    const response = await worker.fetch(request, env, mockCtx);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("proxy-ok");
  });

  it("returns 500 for unknown WORKER_ROLE", async () => {
    const mod = await importWorker();
    const worker = mod.default;
    const env = { WORKER_ROLE: "unknown" };
    const request = new Request("http://localhost/test");

    const response = await worker.fetch(request, env, mockCtx);

    expect(response.status).toBe(500);
  });
});

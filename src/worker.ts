import { handleRouterRequest } from "./router";
import { handleProxyRequest } from "./proxy";
import { errorResponse } from "./http";

export default {
  async fetch(
    request: Request,
    env: { WORKER_ROLE: string; [key: string]: unknown },
    ctx: ExecutionContext,
  ): Promise<Response> {
    switch (env.WORKER_ROLE) {
      case "router":
        return handleRouterRequest(request, env as never, ctx);
      case "proxy":
        return handleProxyRequest(request, env as never, ctx);
      default:
        return errorResponse(`Unknown WORKER_ROLE: ${env.WORKER_ROLE}`, 500);
    }
  },
};

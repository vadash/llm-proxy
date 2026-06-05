import { describe, expect, it } from "vitest";
import {
  CORS_HEADERS,
  corsResponse,
  errorResponse,
  jsonResponse,
} from "../../src/http";

describe("HTTP Response Helpers", () => {
  describe("CORS_HEADERS", () => {
    it("contains required CORS headers", () => {
      expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
      expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toBe(
        "GET, POST, OPTIONS",
      );
      expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toBe(
        "Authorization, Content-Type",
      );
    });
  });

  describe("jsonResponse", () => {
    it("returns JSON body with correct Content-Type and CORS headers", async () => {
      const response = jsonResponse({ foo: "bar" }, 200);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Content-Type",
      );

      const body = await response.json();
      expect(body).toEqual({ foo: "bar" });
    });

    it("defaults status to 200 when omitted", () => {
      const response = jsonResponse({ ok: true });
      expect(response.status).toBe(200);
    });
  });

  describe("errorResponse", () => {
    it('returns {error: message} with given status and CORS headers', async () => {
      const response = errorResponse("bad", 400);

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

      const body = await response.json();
      expect(body).toEqual({ error: "bad" });
    });
  });

  describe("corsResponse", () => {
    it("returns 204 with CORS headers and no body", async () => {
      const response = corsResponse();

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Authorization, Content-Type",
      );

      const text = await response.text();
      expect(text).toBe("");
    });
  });
});

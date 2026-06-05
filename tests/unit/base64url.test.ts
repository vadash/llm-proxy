import { describe, expect, it } from "vitest";
import { encodeBase64Url, decodeBase64Url } from "../../src/base64url";

describe("encodeBase64Url", () => {
  it("encodes a standard HTTPS URL to URL-safe base64", () => {
    const input = "https://api.openai.com/v1/chat/completions";
    const encoded = encodeBase64Url(input);

    expect(encoded).not.toMatch(/[+/=]/);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces web-safe output for strings that would normally have +, /, =", () => {
    const input = "???>>>,,,";
    const encoded = encodeBase64Url(input);

    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe("decodeBase64Url", () => {
  it("decodes URL-safe base64 back to the original URL", () => {
    const original = "https://api.openai.com/v1/chat/completions";
    const encoded = encodeBase64Url(original);

    expect(decodeBase64Url(encoded)).toBe(original);
  });

  it("handles URL-safe chars (- → +, _ → /)", () => {
    const raw = btoa("hello+world");
    const urlSafe = raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const decoded = decodeBase64Url(urlSafe);
    expect(decoded).toBe("hello+world");
  });

  it("handles stripped padding", () => {
    const original = "test";
    const encoded = encodeBase64Url(original);
    expect(encoded).not.toContain("=");

    expect(decodeBase64Url(encoded)).toBe(original);
  });
});

describe("round-trip", () => {
  it("encode then decode returns original string", () => {
    const inputs = [
      "https://api.anthropic.com/v1/messages",
      "https://api.openai.com/v1/chat/completions",
      "hello world",
      "",
      "a",
    ];

    for (const input of inputs) {
      expect(decodeBase64Url(encodeBase64Url(input))).toBe(input);
    }
  });
});

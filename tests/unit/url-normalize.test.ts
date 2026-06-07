import { describe, it, expect } from "vitest";
import { normalizeUrl, constructTargetUrl } from "../../src/url-normalize";

describe("normalizeUrl", () => {
  it("collapses multiple consecutive slashes to single slash", () => {
    expect(normalizeUrl("https://api.example.com//v1///chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("removes trailing slash from pathname", () => {
    expect(normalizeUrl("https://api.example.com/v1/")).toBe(
      "https://api.example.com/v1",
    );
  });

  it("keeps root pathname as single slash", () => {
    expect(normalizeUrl("https://api.example.com/")).toBe(
      "https://api.example.com/",
    );
  });

  it("preserves query parameters", () => {
    expect(
      normalizeUrl("https://api.example.com//v1///chat?model=gpt-4"),
    ).toBe("https://api.example.com/v1/chat?model=gpt-4");
  });

  it("preserves port numbers", () => {
    expect(normalizeUrl("https://api.example.com:8080//v1")).toBe(
      "https://api.example.com:8080/v1",
    );
  });

  it("normalizes chat/completions paths to single /v1 prefix", () => {
    expect(normalizeUrl("https://api.example.com/v1/chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("removes duplicate /v1 in chat/completions paths", () => {
    expect(
      normalizeUrl("https://api.example.com/v1//chat/completions/v1//"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("forces /v1 for /v2/chat/completions", () => {
    expect(normalizeUrl("https://api.example.com/v2/chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("adds /v1 prefix to /chat/completions", () => {
    expect(normalizeUrl("https://api.example.com/chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("does not normalize non-chat/completions paths", () => {
    expect(normalizeUrl("https://api.example.com/v1/models")).toBe(
      "https://api.example.com/v1/models",
    );
    expect(normalizeUrl("https://api.example.com/v2/models")).toBe(
      "https://api.example.com/v2/models",
    );
  });
});

describe("constructTargetUrl", () => {
  it("combines decoded URL with extra path", () => {
    expect(
      constructTargetUrl("https://api.example.com/v1", "chat/completions"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("strips trailing slash from decoded URL before combining", () => {
    expect(
      constructTargetUrl("https://api.example.com/v1/", "chat/completions"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("returns decoded URL when extra path is empty", () => {
    expect(constructTargetUrl("https://api.example.com/v1", "")).toBe(
      "https://api.example.com/v1",
    );
  });

  it("strips trailing slash when no extra path", () => {
    expect(constructTargetUrl("https://api.example.com/v1/", "")).toBe(
      "https://api.example.com/v1",
    );
  });

  it("normalizes multiple slashes in decoded URL", () => {
    expect(
      constructTargetUrl(
        "https://api.example.com//v1///chat/completions",
        "",
      ),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("normalizes multiple slashes in combined URL", () => {
    // decodedUrl ends with slash, extraPath starts with slash would create double
    // but our implementation avoids this by stripping trailing from decodedUrl
    expect(
      constructTargetUrl("https://api.example.com/v1/", "chat/completions"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("handles root URL with full path in extra path", () => {
    expect(
      constructTargetUrl("https://api.example.com/", "v1/chat/completions"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });

  it("handles URL without trailing slash with extra path", () => {
    expect(
      constructTargetUrl("https://api.example.com", "v1/chat/completions"),
    ).toBe("https://api.example.com/v1/chat/completions");
  });
});
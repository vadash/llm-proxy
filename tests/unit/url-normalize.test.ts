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

  it("normalizes chat/completions paths with existing /v1 prefix", () => {
    expect(normalizeUrl("https://api.example.com/v1/chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("adds /v1 before /chat/completions when missing", () => {
    expect(normalizeUrl("https://api.example.com/chat/completions")).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });

  it("forces /v1 for /v2/chat/completions", () => {
    expect(normalizeUrl("https://api.example.com/v2/chat/completions")).toBe(
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

  it("inserts /v1 before chat/completions for nested paths without version", () => {
    expect(normalizeUrl("https://api.longcat.chat/openai/chat/completions")).toBe(
      "https://api.longcat.chat/openai/v1/chat/completions",
    );
  });

  it("preserves version embedded in base path (e.g. /v1beta)", () => {
    expect(
      normalizeUrl("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"),
    ).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
  });

  it("preserves /v1 in nested position when present", () => {
    expect(normalizeUrl("https://api.longcat.chat/openai/v1/chat/completions")).toBe(
      "https://api.longcat.chat/openai/v1/chat/completions",
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

  it("inserts /v1 for NVIDIA-style base + chat/completions", () => {
    expect(
      constructTargetUrl("https://integrate.api.nvidia.com/v1", "chat/completions"),
    ).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
  });

  it("preserves /v1beta for Google-style base + chat/completions", () => {
    expect(
      constructTargetUrl(
        "https://generativelanguage.googleapis.com/v1beta/openai",
        "chat/completions",
      ),
    ).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
  });

  it("inserts /v1 for longcat-style base + chat/completions", () => {
    expect(
      constructTargetUrl("https://api.longcat.chat/openai", "chat/completions"),
    ).toBe("https://api.longcat.chat/openai/v1/chat/completions");
  });
});

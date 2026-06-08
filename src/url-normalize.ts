function normalizeChatCompletionsPath(pathname: string): string {
  if (!pathname.includes("chat") || !pathname.includes("completions")) {
    return pathname;
  }
  // Already has /v{N} directly before chat/completions → normalize to /v1
  if (/\/v\d+(?=\/chat\/completions)/.test(pathname)) {
    return pathname.replace(/\/v\d+\/chat\/completions/, "/v1/chat/completions");
  }
  // Has a version elsewhere (e.g. /v1beta/openai/) → leave alone
  if (/\/v\d+/.test(pathname)) {
    return pathname;
  }
  // No version at all → insert /v1 right before chat/completions
  return pathname.replace(/\/chat\/completions/, "/v1/chat/completions");
}

export function normalizeUrl(targetUrl: string): string {
  const url = new URL(targetUrl);
  // Collapse multiple consecutive slashes in pathname to single slash
  let normalized = url.pathname.replace(/\/+/g, "/");
  // Remove trailing slash from pathname (but keep root "/" as "/")
  normalized = normalized.replace(/\/+$/, "") || "/";
  // Normalize chat/completions paths to have single /v1 prefix
  normalized = normalizeChatCompletionsPath(normalized);
  url.pathname = normalized;
  return url.toString();
}

export function constructTargetUrl(
  decodedUrl: string,
  extraPath: string,
): string {
  // Strip trailing slashes from decoded URL
  const decodedUrlClean = decodedUrl.replace(/\/+$/, "");
  // Combine with extra path, avoiding double slashes at join point
  const combined = extraPath
    ? `${decodedUrlClean}/${extraPath}`
    : decodedUrlClean;
  // Normalize the final URL
  return normalizeUrl(combined);
}
function normalizeChatCompletionsPath(pathname: string): string {
  if (!pathname.includes("chat") || !pathname.includes("completions")) {
    return pathname;
  }
  // Remove all version segments (/v1, /v2, etc.) from the path
  const withoutVersion = pathname.replace(/\/v\d+/g, "");
  // Add single /v1 at the start
  return `/v1${withoutVersion}`;
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
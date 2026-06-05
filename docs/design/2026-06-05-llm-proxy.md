# LLM Proxy — Design Document

## Purpose

Rotate exit IPs across multiple Cloudflare Workers so a single PC can use multiple API keys without upstream bans or rate limits caused by shared IP.

## Architecture

```
Client (LM Studio / etc)
  │
  │  POST /{PASS}/{PROXY_NUM}/{BASE64_URL}/{...path}
  │  Authorization: Bearer sk-client-own-key
  │  Body: {"model":"gpt-4","stream":true,...}
  v
Router Worker (public route)
  1. Extract PASS from path → validate against AUTH_KEY
  2. Extract PROXY_NUM → index = PROXY_NUM % N (N = deployed proxy count)
  3. Extract BASE64_URL → decode → base upstream URL (URL-safe base64)
  4. Real URL = decoded_base + "/" + remaining_path
  5. Forward to Proxy[index] via service binding (internal headers)
  v
Proxy Worker[N] (no public route)
  1. Verify X-Internal-Auth
  2. Strip all identity/Cloudflare headers
  3. Generate deterministic fake IP: SHA-256(proxy_number + target_domain) → IPv4
  4. Inject X-Forwarded-For: <fake_ip>
  5. Pass through: Authorization, Content-Type, Accept, body (untouched)
  6. fetch(real_url) → stream response back (SSE passthrough)
```

## URL Format

```
/{PASS}/{PROXY_NUM}/{BASE64_URL}/{...extra_path}
```

| Segment | Example | Description |
|---|---|---|
| PASS | `yourpassword` | User password, checked against AUTH_KEY |
| PROXY_NUM | `3` | Proxy selection index (modulo N) |
| BASE64_URL | `aHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MQ` | Web-safe base64 of upstream base URL |
| extra_path | `chat/completions` | Appended to decoded URL |

Full example:
```
POST https://router.example.com/yourpassword/3/aHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MQ/chat/completions
```
→ Proxy #3 calls `https://api.openai.com/v1/chat/completions`

## Fake IP Generation

Deterministic per proxy worker + target domain. No storage, no cookies.

```
input = proxy_number + target_domain
hash = SHA-256(input)
fake_ip = hash[0:4] → "xxx.xxx.xxx.xxx"
```

Each proxy worker gets a unique but stable fake IP for each upstream domain.

## Headers

### Stripped (never reach upstream)

- `CF-Connecting-IP`, `CF-RAY`, `CF-Visitor`, `CF-IPCountry`
- `X-Real-IP`, `X-Forwarded-For` (replaced with fake)
- `Host` (replaced with target host)

### Injected

- `X-Forwarded-For: <fake_ip>` — deterministic from proxy number + domain

### Passed through (from client)

- `Authorization` — client's own API key
- `Content-Type`
- `Accept` — needed for SSE streaming
- Request body — zero parse, pass-through

## SSE / Streaming

No special handling. `fetch()` response stream pipes through directly. Cloudflare Workers handle streaming natively.

## Project Structure

```
src/
  worker.ts        # Entry: dispatch by WORKER_ROLE
  router.ts        # Router: auth + proxy selection + URL decode
  proxy.ts         # Proxy: internal auth + header strip + fake IP + upstream call
  fake-ip.ts       # Deterministic fake IP from SHA-256(proxy_num + domain)
  base64url.ts     # URL-safe base64 encode/decode
  http.ts          # Response helpers (CORS, error JSON)
wrangler.toml      # Router + N proxy workers
```

~7 source files. No Durable Objects, no body parsing, no model registry.

## Wrangler Layout

Single `wrangler.toml`:

- **Router worker**: public route, receives all client requests
- **Proxy workers**: N workers with no public routes, accessible only via service bindings from router
- Each proxy has unique `PROXY_INDEX` env var (used as fake IP seed)

## Auth Flow

1. Client sends PASS in URL path
2. Router validates PASS against AUTH_KEY env var
3. Router forwards to proxy via service binding with `X-Internal-Auth` header
4. Proxy validates `X-Internal-Auth` against `INTERNAL_AUTH_SECRET`

Double-check is defense-in-depth. Proxy workers have no public routes anyway.

## Constraints

- No body parsing — pure pass-through
- No credential storage — client provides its own API key
- No Durable Objects — stateless
- No cookies — not a browser client
- URL-safe base64 only (RFC 4648 §5)
- Body size limit: 512 KB

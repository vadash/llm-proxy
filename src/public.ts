export function publicPage(routerDomain: string, authKey: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LLM Proxy — URL Encoder</title>
<style>
  :root { --bg: #0e1117; --card: #161b22; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #58a6ff; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; max-width: 600px; width: 100%; }
  h1 { font-size: 1.25rem; margin-bottom: .25rem; }
  .sub { color: var(--muted); font-size: .85rem; margin-bottom: 1.5rem; }
  label { display: block; font-size: .8rem; color: var(--muted); margin-bottom: .25rem; margin-top: 1rem; }
  input { width: 100%; padding: .6rem .75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: monospace; font-size: .9rem; outline: none; }
  input:focus { border-color: var(--accent); }
  .result { margin-top: 1rem; padding: .75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; font-family: monospace; font-size: .85rem; word-break: break-all; color: var(--accent); cursor: pointer; position: relative; user-select: all; }
  .result:hover { border-color: var(--accent); }
  .hint { color: var(--muted); font-size: .75rem; margin-top: .5rem; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <h1>LLM Proxy URL Encoder</h1>
  <p class="sub">Encode an upstream API URL for use with the proxy router.</p>

  <label for="base">Upstream base URL</label>
  <input id="base" type="text" placeholder="https://api.openai.com/v1" value="https://api.openai.com/v1">

  <label for="path">Extra path <span style="color:var(--muted)">(optional)</span></label>
  <input id="path" type="text" placeholder="chat/completions">

  <label for="proxy">Proxy number</label>
  <input id="proxy" type="number" placeholder="1" value="1" min="0">

  <label>Encoded base URL</label>
  <div class="result" id="encoded" onclick="copyText(this)">—</div>

  <label>Full proxy URL</label>
  <div class="result" id="full" onclick="copyText(this)">—</div>
  <p class="hint">Click to select. Already authenticated — URL is ready to copy.</p>
</div>
<script>
const $=s=>document.getElementById(s);
const base=$("base"),path=$("path"),proxy=$("proxy"),enc=$("encoded"),full=$("full");

function b64url(str){return btoa(str).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"")}

function update(){
  const b=base.value.trim();
  if(!b){enc.textContent=full.textContent="—";return}
  const e=b64url(b);
  enc.textContent=e;
  const p=path.value.trim();
  const n=proxy.value||"1";
  const suffix=p?"/"+p:"";
  full.textContent="https://${routerDomain}/${authKey}/"+n+"/"+e+suffix;
}
base.addEventListener("input",update);
path.addEventListener("input",update);
proxy.addEventListener("input",update);
update();

function copyText(el){
  const range=document.createRange();
  range.selectNodeContents(el);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

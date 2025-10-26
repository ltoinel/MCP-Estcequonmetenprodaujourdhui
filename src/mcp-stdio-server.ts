import { getDeploymentDecision, getDeploymentReasons } from './lib/deployment-logic';

// Minimal stdio JSON protocol server to replace the CLI.
// Protocol (line-delimited JSON):
// Request: { id: string|number, method: 'check_deployment_status'|'get_deployment_reasons', params: {...} }
// Response: { id, result: any } or { id, error: { message } }

function toDateFromParams(dateStr?: string) {
  if (!dateStr) return new Date();
  return new Date(dateStr + 'T00:00:00Z');
}

process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch (err) {
      // invalid JSON: ignore or send error
      const msg = { id: null, error: { message: 'Invalid JSON' } };
      process.stdout.write(JSON.stringify(msg) + '\n');
      continue;
    }

    (async () => {
      const id = req.id ?? null;
      try {
        if (req.method === 'check_deployment_status') {
          const params = req.params || {};
          const date = toDateFromParams(params.date);
          const lang = params.lang;
          const res = getDeploymentDecision(date, lang);
          process.stdout.write(JSON.stringify({ id, result: res }) + '\n');
        } else if (req.method === 'get_deployment_reasons') {
          const lang = req.params?.lang;
          const res = getDeploymentReasons(lang);
          process.stdout.write(JSON.stringify({ id, result: res }) + '\n');
        } else {
          process.stdout.write(JSON.stringify({ id, error: { message: 'Unknown method' } }) + '\n');
        }
      } catch (err: any) {
        process.stdout.write(JSON.stringify({ id, error: { message: String(err?.message || err) } }) + '\n');
      }
    })();
  }
});

process.stdin.on('end', () => process.exit(0));

// If stdin is a TTY (interactive), print a small banner to help manual testing
if (process.stdin.isTTY) {
  console.log('MCP stdio server ready — send JSON-RPC like requests as lines.');
  console.log('Example: {"id":1,"method":"check_deployment_status","params":{"date":"2025-10-31","lang":"en"}}');
}

/**
 * MCP Stdio Server - Lightweight Custom Implementation
 * 
 * A simple line-delimited JSON-RPC stdio server WITHOUT @modelcontextprotocol/sdk dependency.
 * This is useful for:
 * - Shell scripts and pipes (printf | npm run start-stdio)
 * - Testing without SDK overhead
 * - Environments where you want minimal dependencies
 * 
 * For official MCP protocol compliance (recommended for VS Code), use mcp-server.ts instead.
 * 
 * Protocol (line-delimited JSON):
 * Request:  { id: string|number, method: 'check_deployment_status'|'get_deployment_reasons', params: {...} }
 * Response: { id, result: any } or { id, error: { message } }
 * 
 * Usage: npm run start-stdio (or node dist/mcp-stdio-server.js)
 */

import { getDeploymentDecision, getDeploymentReasons } from './lib/deployment-logic';

/**
 * Parses a date string parameter and returns a Date object.
 * 
 * @param dateStr - Optional date string in YYYY-MM-DD format
 * @returns Date object (current date if no parameter provided)
 */
function toDateFromParams(dateStr?: string): Date {
  if (!dateStr) return new Date();
  return new Date(dateStr + 'T00:00:00Z');
}

process.stdin.setEncoding('utf8');
let buffer = '';

/**
 * Handles incoming data from stdin, processes line-delimited JSON requests.
 * 
 * Protocol:
 * - Reads line-by-line JSON from stdin
 * - Parses each request: { id, method, params }
 * - Writes response to stdout: { id, result } or { id, error }
 * 
 * Supported methods:
 * - check_deployment_status: Returns deployment decision
 * - get_deployment_reasons: Returns all reasons by locale
 */
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
      const id = (req as Record<string, unknown>)?.id ?? null;
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(JSON.stringify({ id, error: { message: msg } }) + '\n');
      }
    })();
  }
});

/**
 * Handles stdin end event - exits process cleanly.
 */
process.stdin.on('end', () => process.exit(0));

/**
 * Prints usage banner when running in interactive TTY mode.
 * Helps developers understand the protocol during manual testing.
 */
if (process.stdin.isTTY) {
  console.log('MCP stdio server ready — send JSON-RPC like requests as lines.');
  console.log('Example: {"id":1,"method":"check_deployment_status","params":{"date":"2025-10-31","lang":"en"}}');
}

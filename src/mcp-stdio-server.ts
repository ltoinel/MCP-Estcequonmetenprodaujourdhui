#!/usr/bin/env node

/**
 * MCP Server - Official SDK Implementation
 * 
 * Uses the official @modelcontextprotocol/sdk for full MCP protocol compliance.
 * This is the RECOMMENDED server for:
 * - VS Code MCP integration (.vscode/mcp.json)
 * - Official MCP clients (GitHub Copilot, etc.)
 * - Production MCP deployments
 * 
 * This is the MAIN MCP server implementation using the official SDK.
 * 
 * Usage: npm start (or node dist/mcp-stdio-server.js)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canDeployToday, getDeploymentDecision, getDeploymentReasons } from './lib/deployment-logic';

/**
 * Creates and configures an MCP server instance with deployment tools.
 * 
 * Registers two tools:
 * - check_deployment_status: Returns deployment decision for today
 * - get_deployment_reasons: Returns all possible reasons by decision type
 * 
 * @returns Configured MCP server instance
 */
function createServerInstance(): Server {
  const server = new Server(
    {
      name: 'estcequonmetenprodaujourdhui',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'check_deployment_status',
          description: "Checks if deployment is allowed today based on the day of the week. Returns a decision (yes/caution/blocked/no) with a humorous reason. Accepts optional 'lang' argument (e.g. 'en', 'fr').",
          inputSchema: {
            type: 'object',
            properties: { lang: { type: 'string' } },
            required: []
          }
        },
        {
          name: 'get_deployment_reasons',
          description: "Returns the complete list of possible reasons for each decision type (yes, caution, blocked, no). Accepts optional 'lang' argument.",
          inputSchema: {
            type: 'object',
            properties: { lang: { type: 'string' } },
            required: []
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { params } = request;
    const { name, arguments: args } = params;

    if (name === 'check_deployment_status') {
      const lang = args?.lang as string | undefined;
      const result = canDeployToday(lang);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    if (name === 'get_deployment_reasons') {
      const lang = args?.lang as string | undefined;
      const reasons = getDeploymentReasons(lang);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(reasons, null, 2)
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}

/**
 * Main entry point - initializes and starts the MCP server.
 * 
 * Creates the server instance, attaches stdio transport, and connects.
 * Logs startup message to stderr (stdout is reserved for MCP protocol).
 * 
 * @throws Error if server initialization or connection fails
 */
async function main() {
  try {
    const server = createServerInstance();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server 'estcequonmetenprodaujourdhui' started on stdio");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MCP server error:', message);
    process.exit(1);
  }
}

main();
/**
 * MCP Stdio Server - Lightweight Custom Implementation
 * 
 * A simple line-delimited JSON-RPC stdio server WITHOUT @modelcontextprotocol/sdk dependency.
 * This is useful for:
 * - Shell scripts and pipes (printf | npm run start-stdio)
 * - Testing without SDK overhead
 * - Environments where you want minimal dependencies
 * 
 * This file is the official MCP protocol-compliant server (SDK-backed).
 * 
 * Protocol (line-delimited JSON):
 * Request:  { id: string|number, method: 'check_deployment_status'|'get_deployment_reasons', params: {...} }
 * Response: { id, result: any } or { id, error: { message } }
 * 
 * Usage: npm run start-stdio (or node dist/mcp-stdio-server.js)


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

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
 * For a simpler stdio JSON-RPC server without SDK dependency, see mcp-stdio-server.ts
 * 
 * Usage: npm start (or node dist/mcp-server.js)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canDeployToday, getDeploymentReasons } from './lib/deployment-logic';

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

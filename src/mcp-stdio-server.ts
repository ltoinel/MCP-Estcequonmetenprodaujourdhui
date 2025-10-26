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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServerInstance } from './mcp-core';

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
    console.info("MCP server 'estcequonmetenprodaujourdhui' started on stdio");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MCP server error:', message);
    process.exit(1);
  }
}

main();
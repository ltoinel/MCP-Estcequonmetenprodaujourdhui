#!/usr/bin/env node

/**
 * @fileoverview
 * Main stdio server entry point for the MCP (Model Context Protocol) implementation.
 * This server exposes a stdio-based transport for MCP-compliant clients (e.g. VS Code, Copilot).
 * It uses the official @modelcontextprotocol/sdk for protocol compliance and tool orchestration.
 *
 * Usage:
 *   npm start
 *   node dist/mcp-stdio-server.js
 *
 * Best practices:
 * - Only stdio transport is supported (no HTTP)
 * - All requests/responses are JSON (via stdio)
 * - Errors are logged to stderr and cause process exit
 * - Server is stateless and safe for concurrent requests
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServerInstance } from './mcp-core';

/**
 * Initializes and starts the MCP stdio server.
 *
 * - Creates the MCP server instance (shared tool logic)
 * - Attaches the stdio transport for protocol communication
 * - Connects the server to the transport
 * - Logs a startup message to stderr (stdout is reserved for protocol)
 *
 * Exits the process with code 1 on fatal error.
 */
async function main() {
  try {
    // Create the MCP server instance (tool handlers, etc.)
    const server = createServerInstance();

    // Attach stdio transport for protocol communication
    const transport = new StdioServerTransport();

    // Connect the server to the transport (start listening)
    await server.connect(transport);

    // Log startup message to stderr (for diagnostics)
    console.info("MCP server 'estcequonmetenprodaujourdhui' started on stdio");
    
  } catch (err) {
    // Log fatal errors to stderr and exit
    const message = err instanceof Error ? err.message : String(err);
    console.error('MCP server error:', message);
    process.exit(1);
  }
}

// Start the stdio server
main();
#!/usr/bin/env node

/**
 * @fileoverview
 * Main HTTP server entry point for the MCP (Model Context Protocol) implementation.
 * This server exposes a single POST /mcp endpoint for MCP-compliant clients (e.g. VS Code, Copilot).
 * It uses the official @modelcontextprotocol/sdk for protocol compliance and tool orchestration.
 *
 * Usage:
 *   npm run start-http
 *   node dist/mcp-http-server.js
 *
 * Best practices:
 * - Only POST /mcp is supported (no GET/PUT/DELETE)
 * - All requests/responses are JSON
 * - Errors are logged and returned as JSON-RPC errors
 * - Server is stateless and safe for concurrent requests
 */

import { createServerInstance } from './mcp-core';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

// Initialize the Express application
const app = express();
// Enable JSON body parsing for all incoming requests
app.use(express.json());

// Create the MCP server instance (shared tool logic)
const server = createServerInstance();

/**
 * POST /mcp
 * Main endpoint for MCP protocol requests.
 * Expects a JSON body with MCP-compliant fields (id, method, params, ...).
 * Handles the request using the MCP SDK and returns a JSON response.
 */
app.post('/mcp', async (req, res) => {
    try {
        // Log the incoming request for debugging/audit
        console.log('Received MCP request:', req.body);

        // Create a transport layer for this HTTP request/response cycle
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Use default session handling
            enableJsonResponse: true       // Always respond with JSON
        });

        // Ensure transport is closed if the client disconnects
        res.on('close', () => {
            transport.close();
        });

        // Connect the MCP server to the transport for this request
        await server.connect(transport);
        
        // Delegate the actual request handling to the SDK transport
        await transport.handleRequest(req, res, req.body);

    } catch (error) {
        // Log and return a JSON-RPC error if anything fails
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});

// Start the HTTP server on the configured port (default: 3000)
const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    // Log fatal startup errors and exit
    console.error('Server error:', error);
    process.exit(1);
});
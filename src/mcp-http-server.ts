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
import { createServerInstance } from './mcp-core';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const app = express();
app.use(express.json());

const server = createServerInstance();

app.post('/mcp', async (req, res) => {

    try {

        console.log('Received MCP request:', req.body);

        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });

        res.on('close', () => {
            transport.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

    } catch (error) {
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

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    console.error('Server error:', error);
    process.exit(1);
});
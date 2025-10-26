
import express from 'express';
import { canDeployToday, getDeploymentReasons } from './lib/deployment-logic';

// Create the MCP Server (mirror of src/mcp-server.ts behavior)
// Export an Express app for tests and simple usage (keeps backwards compatibility)
export const app = express();
app.use(express.json());

function getLangFromReq(req: express.Request): string | undefined {
    return (req.query.lang as string) || req.headers['accept-language']?.toString().split(',')[0];
}

// POST /mcp - simple MCP-format JSON-RPC handler (keeps compatibility with tests)
app.post('/mcp', (req, res) => {
    const body = req.body as unknown;
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ id: null, error: { message: 'Invalid request body' } });
    }

    const bodyObj = body as Record<string, unknown>;
    const id = bodyObj.id ?? null;
    const method = bodyObj.method;
    const params = (bodyObj.params as Record<string, unknown>) || {};

    try {
        if (method === 'check_deployment_status') {
            const lang = (params.lang as string) || getLangFromReq(req);
            const dateStr = params.date as string | undefined;
            const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
            const result = canDeployToday(lang);
            return res.json({ id, result });
        }

        if (method === 'get_deployment_reasons') {
            const lang = (params.lang as string) || getLangFromReq(req);
            const result = getDeploymentReasons(lang);
            return res.json({ id, result });
        }

        return res.status(400).json({ id, error: { message: 'Unknown method' } });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ id, error: { message: msg } });
    }
});

// GET /status and /reasons for direct queries
app.get('/status', (req, res) => {
    const lang = getLangFromReq(req);
    const dateStr = req.query.date as string | undefined;
    const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
    const result = canDeployToday(lang);
    res.json({ id: null, result });
});

app.get('/reasons', (req, res) => {
    const lang = getLangFromReq(req);
    const reasons = getDeploymentReasons(lang);
    res.json({ id: null, result: reasons });
});

// When executed directly, start a full SDK-backed MCP server using SSE transport.
// This uses dynamic imports so requiring this module in tests does not attempt to
// load ESM-only SDK files inside Jest.
async function startSdkServer() {
    const [{ Server }, { SSEServerTransport }, types, deployment] = await Promise.all([
        import('@modelcontextprotocol/sdk/server/index.js'),
        import('@modelcontextprotocol/sdk/server/sse.js'),
        import('@modelcontextprotocol/sdk/types.js'),
        import('./lib/deployment-logic')
    ]);

    const { CallToolRequestSchema, ListToolsRequestSchema } = types;
    const { canDeployToday: canDeploy, getDeploymentReasons: getReasons } = deployment as typeof import('./lib/deployment-logic');

    function createServerInstance() {
        const server = new Server({ name: 'estcequonmetenprodaujourdhui', version: '1.0.0' }, { capabilities: { tools: {} } });

        server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'check_deployment_status',
                        description: "Checks if deployment is allowed today based on the day of the week.",
                        inputSchema: { type: 'object', properties: { lang: { type: 'string' } }, required: [] }
                    },
                    {
                        name: 'get_deployment_reasons',
                        description: "Returns the complete list of possible reasons for each decision type.",
                        inputSchema: { type: 'object', properties: { lang: { type: 'string' } }, required: [] }
                    }
                ]
            };
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { params } = request;
            const { name, arguments: args } = params;

            if (name === 'check_deployment_status') {
                const lang = args?.lang as string | undefined;
                const result = canDeploy(lang);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }

            if (name === 'get_deployment_reasons') {
                const lang = args?.lang as string | undefined;
                const reasons = getReasons(lang);
                return { content: [{ type: 'text', text: JSON.stringify(reasons, null, 2) }] };
            }

            throw new Error(`Unknown tool: ${name}`);
        });

        return server;
    }

    const server = createServerInstance();
    const sessions = new Map();
    const sdkApp = express();
    sdkApp.use(express.json());

    sdkApp.get('/mcp', async (req, res) => {
        try {
            const transport = new SSEServerTransport('/mcp', res);
            await server.connect(transport);
            sessions.set(transport.sessionId, transport);

            res.on('close', () => {
                sessions.delete(transport.sessionId);
                transport.close().catch(() => { /* ignore */ });
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            res.status(500).end(msg);
        }
    });

    sdkApp.post('/mcp', async (req, res) => {
        const sessionId = (req.query.sessionId as string) || undefined;
        if (!sessionId) return res.status(400).send('Missing sessionId');
        const transport = sessions.get(sessionId);
        if (!transport) return res.status(404).send('Session not found');
        try {
            await transport.handlePostMessage(req, res);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            res.status(500).end(msg);
        }
    });

    const port = parseInt(process.env.PORT || '3000');
    sdkApp.listen(port, () => {
        console.log(`Serveur MCP HTTP (SDK SSE) démarré sur http://localhost:${port}/mcp`);
    }).on('error', error => {
        console.error('Erreur serveur :', error);
        process.exit(1);
    });
}

if (require.main === module) {
    // Start SDK-backed server when executed directly
    startSdkServer().catch(err => {
        console.error('Failed to start SDK MCP HTTP server:', err);
        process.exit(1);
    });
}

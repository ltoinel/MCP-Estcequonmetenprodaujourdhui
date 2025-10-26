/**
 * MCP HTTP Server - REST API Wrapper
 * 
 * Exposes deployment decision logic via HTTP endpoints:
 * - POST /mcp - MCP-format JSON-RPC requests
 * - GET /status - Direct deployment status query
 * - GET /reasons - Retrieve all reasons by locale
 * 
 * Supports locale via query parameter (?lang=en) or Accept-Language header.
 * 
 * Usage: npm run start-http (or node dist/mcp-http-server.js)
 */

import express from 'express';
import { getDeploymentDecision, getDeploymentReasons } from './lib/deployment-logic';

export const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

/**
 * Extracts language/locale from request query parameter or Accept-Language header.
 * 
 * @param req - Express request object
 * @returns Language code (e.g., 'en', 'fr') or undefined
 */
function getLangFromReq(req: express.Request): string | undefined {
  return (req.query.lang as string) || req.headers['accept-language']?.toString().split(',')[0];
}

/**
 * POST /mcp - MCP-format JSON-RPC endpoint
 * 
 * Accepts requests in MCP format:
 * Body: { id, method, params }
 * Response: { id, result } or { id, error }
 * 
 * Supported methods:
 * - check_deployment_status: Returns deployment decision
 * - get_deployment_reasons: Returns all reasons by locale
 */
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
      const result = getDeploymentDecision(d, lang);
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

/**
 * GET /status - Direct deployment status query
 * 
 * Query parameters:
 * - lang: Language code (e.g., 'en', 'fr')
 * - date: Date in YYYY-MM-DD format (defaults to today)
 * 
 * Returns MCP-wrapped response: { id: null, result: DecisionResult }
 */
app.get('/status', (req, res) => {
  const lang = getLangFromReq(req);
  const dateStr = req.query.date as string | undefined;
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const result = getDeploymentDecision(d, lang);
  res.json({ id: null, result });
});

/**
 * GET /reasons - Retrieve all deployment reasons
 * 
 * Query parameters:
 * - lang: Language code (e.g., 'en', 'fr')
 * 
 * Returns MCP-wrapped response: { id: null, result: Record<string, string[]> }
 */
app.get('/reasons', (req, res) => {
  const lang = getLangFromReq(req);
  const reasons = getDeploymentReasons(lang);
  res.json({ id: null, result: reasons });
});

/**
 * Starts HTTP server when executed directly (not imported for testing).
 * Binds to PORT environment variable or defaults to 3000.
 */
if (require.main === module) {
  app.listen(port, () => {
    console.log(`HTTP wrapper listening on http://localhost:${port}`);
  });
}

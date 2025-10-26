import request from 'supertest';

// Import compiled app from dist so we don't need to compile TS during test runtime
const { app } = require('../dist/mcp-http-server');

/**
 * Type definition for MCP response format
 */
interface McpResponse {
  id: number | null;
  result?: {
    decision: string;
    can_deploy: boolean;
    date: string;
    weekday: string;
    reason: string;
    emoji: string;
    message: string;
  };
  error?: {
    message: string;
  };
}

describe('mcp-http-server (MCP format)', () => {
  test('POST /mcp check_deployment_status returns MCP-wrapped result', async () => {
    const res = await request(app)
      .post('/mcp')
      .send({ id: 1, method: 'check_deployment_status', params: { date: '2025-10-26', lang: 'fr' } })
      .set('Content-Type', 'application/json')
      .expect(200);

    const body = res.body as McpResponse;
    expect(body).toHaveProperty('id', 1);
    expect(body).toHaveProperty('result');
    expect(body.result).toHaveProperty('decision', 'no');
  });

  test('GET /status returns MCP-wrapped result with id null', async () => {
    const res = await request(app).get('/status?date=2025-10-26&lang=fr').expect(200);
    const body = res.body as McpResponse;
    expect(body).toHaveProperty('id', null);
    expect(body).toHaveProperty('result');
    expect(body.result).toHaveProperty('decision', 'no');
  });
});

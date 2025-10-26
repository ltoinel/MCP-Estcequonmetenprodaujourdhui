import { spawn } from 'child_process';

function waitForStartup(timeout = 3000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/mcp-server.js'], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    const onData = (chunk: string) => {
      stderr += chunk;
      if (stderr.includes("MCP server 'estcequelonmetenprodaujourdhui' started on stdio")) {
        cleanup();
        resolve(stderr);
      }
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    child.stderr.on('data', onData);
    child.on('error', onError);

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('timeout waiting for mcp-server startup'));
    }, timeout);

    function cleanup() {
      try {
        child.stderr.off('data', onData);
      } catch (_) {}
      try {
        child.off('error', onError as any);
      } catch (_) {}
      clearTimeout(timeoutId);
      // Ensure the child is killed if still running
      try {
        child.kill();
      } catch (_) {}
    }
  });
}

describe('mcp-server (startup)', () => {
  test('starts and prints startup message', async () => {
    const out = await waitForStartup(5000);
    expect(out).toMatch(/MCP server .+ started on stdio/);
  }, 10000);
});

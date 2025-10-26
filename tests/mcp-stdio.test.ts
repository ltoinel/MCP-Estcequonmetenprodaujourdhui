import { spawn } from 'child_process';

function runStdIoServerAndRequest(reqObj: object, timeout = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/mcp-stdio-server.js'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let buffer = '';

    const onData = (chunk: string) => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line);
          cleanup();
          resolve(obj);
        } catch (e) {
          // ignore non-json
        }
      }
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', onData);
    child.on('error', onError);

    // send request after small delay to ensure server ready
    const writeTimeout = setTimeout(() => {
      child.stdin.write(JSON.stringify(reqObj) + '\n');
    }, 200);

    const responseTimeout = setTimeout(() => {
      cleanup();
      reject(new Error('timeout waiting for server response'));
    }, timeout);

    function cleanup() {
      try {
        child.stdout.off('data', onData);
      } catch (_) {}
      try {
        child.off('error', onError as any);
      } catch (_) {}
      clearTimeout(writeTimeout);
      clearTimeout(responseTimeout);
      try {
        child.kill();
      } catch (_) {}
    }
  });
}

describe('mcp-stdio-server', () => {
  test('responds to check_deployment_status request', async () => {
    const req = { id: 1, method: 'check_deployment_status', params: { date: '2025-10-26', lang: 'fr' } };
    const res = await runStdIoServerAndRequest(req);

    expect(res).toHaveProperty('id', 1);
    expect(res).toHaveProperty('result');
    expect(res.result).toHaveProperty('decision', 'no');
  }, 10000);
});

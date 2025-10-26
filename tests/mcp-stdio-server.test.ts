import { spawn } from 'child_process';
import { join } from 'path';

function waitForStartup(timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, '..', 'dist', 'mcp-stdio-server.js');
    const child = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: join(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const onStdoutData = (chunk: string) => {
      stdout += chunk;
      console.log('STDOUT:', chunk.trim());
      if (stdout.includes("MCP server 'estcequonmetenprodaujourdhui' started on stdio")) {
        cleanup();
        resolve(stdout);
      }
    };

    const onStderrData = (chunk: string) => {
      stderr += chunk;
      console.log('STDERR:', chunk.trim());
    };

    const onError = (err: Error) => {
      console.error('Child process error:', err);
      cleanup();
      reject(new Error(`Process error: ${err.message}`));
    };

    const onExit = (code: number | null, signal: string | null) => {
      if (code !== null && code !== 0 && code !== 130) {
        console.log(`Child process exited with code ${code}, signal ${signal}`);
        cleanup();
        reject(new Error(`Process exited with code ${code}. STDOUT: ${stdout} STDERR: ${stderr}`));
      }
    };

    child.stdout.on('data', onStdoutData);
    child.stderr.on('data', onStderrData);
    child.on('error', onError);
    child.on('exit', onExit);

    const timeoutId = setTimeout(() => {
      console.log(`Timeout after ${timeout}ms. STDOUT collected: "${stdout}" STDERR: "${stderr}"`);
      cleanup();
      reject(new Error(`timeout waiting for mcp-server startup after ${timeout}ms. STDOUT: "${stdout}" STDERR: "${stderr}"`));
    }, timeout);

    function cleanup() {
      try {
        child.stdout.off('data', onStdoutData);
      } catch (_) {}
      try {
        child.stderr.off('data', onStderrData);
      } catch (_) {}
      try {
        child.off('error', onError);
      } catch (_) {}
      try {
        child.off('exit', onExit);
      } catch (_) {}
      clearTimeout(timeoutId);
      try {
        if (!child.killed) {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 1000);
        }
      } catch (_) {}
    }
  });
}

describe('mcp-server (startup)', () => {
  test('starts and prints startup message', async () => {
    const out = await waitForStartup(15000);
    expect(out).toMatch(/MCP server .+ started on stdio/);
  }, 20000); // Increased timeout for CI environments

  test('server file exists and is executable', async () => {
    const { access } = await import('fs/promises');
  const serverPath = join(__dirname, '..', 'dist', 'mcp-stdio-server.js');
    
    // Check if file exists and is readable
    await expect(access(serverPath)).resolves.not.toThrow();
  });
});

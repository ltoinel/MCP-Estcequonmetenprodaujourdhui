import { spawn } from 'child_process';
import { join } from 'path';

function waitForStartup(timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
  const serverPath = join(__dirname, '..', 'dist', 'mcp-stdio-server.js');
    const child = spawn('node', [serverPath], { 
      stdio: ['ignore', 'ignore', 'pipe'],
      cwd: join(__dirname, '..')
    });
    
    let stderr = '';
    
    child.stderr.setEncoding('utf8');
    
    const onStderrData = (chunk: string) => {
      stderr += chunk;
      console.log('STDERR:', chunk.trim()); // Debug output for CI
      if (stderr.includes("MCP server 'estcequonmetenprodaujourdhui' started on stdio")) {
        cleanup();
        resolve(stderr);
      }
    };

    const onError = (err: Error) => {
      console.error('Child process error:', err);
      cleanup();
      reject(new Error(`Process error: ${err.message}`));
    };

    const onExit = (code: number | null, signal: string | null) => {
      if (code !== null && code !== 0 && code !== 130) { // 130 is SIGINT (timeout kill)
        console.log(`Child process exited with code ${code}, signal ${signal}`);
        cleanup();
        reject(new Error(`Process exited with code ${code}. STDERR: ${stderr}`));
      }
    };

    child.stderr.on('data', onStderrData);
    child.on('error', onError);
    child.on('exit', onExit);

    const timeoutId = setTimeout(() => {
      console.log(`Timeout after ${timeout}ms. STDERR collected: "${stderr}"`);
      cleanup();
      reject(new Error(`timeout waiting for mcp-server startup after ${timeout}ms. STDERR: "${stderr}"`));
    }, timeout);

    function cleanup() {
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
      // Ensure the child is killed if still running
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

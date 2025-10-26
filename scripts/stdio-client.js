#!/usr/bin/env node
// Interactive stdio client for the MCP stdio server
// Usage: node scripts/stdio-client.js

const { spawn } = require('child_process');
const readline = require('readline');

// Start the server via npm run start-stdio (so it uses the same command as the .vscode config)
const child = spawn('npm', ['run', 'start-stdio'], { stdio: ['pipe', 'pipe', 'inherit'] });

let buffer = '';
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      console.log('\n<= RESPONSE:');
      console.dir(obj, { depth: 3 });
      prompt();
    } catch (e) {
      console.log('\n<= (non-json) ' + line);
      prompt();
    }
  }
});

child.on('exit', (code) => {
  console.log('\nServer exited with code', code);
  process.exit(0);
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function prompt() {
  rl.question('\n> ', (line) => {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0];
    if (!cmd) return prompt();
    if (cmd === 'exit' || cmd === 'quit') {
      child.stdin.end();
      rl.close();
      return;
    }
    if (cmd === 'status') {
      // status [YYYY-MM-DD] [lang]
      const date = parts[1] || undefined;
      const lang = parts[2] || undefined;
      const req = { id: Date.now(), method: 'check_deployment_status', params: {} };
      if (date) req.params.date = date;
      if (lang) req.params.lang = lang;
      child.stdin.write(JSON.stringify(req) + '\n');
      return; // wait for response
    }
    if (cmd === 'reasons') {
      // reasons [lang]
      const lang = parts[1] || undefined;
      const req = { id: Date.now(), method: 'get_deployment_reasons', params: {} };
      if (lang) req.params.lang = lang;
      child.stdin.write(JSON.stringify(req) + '\n');
      return;
    }
    if (cmd === 'help') {
      console.log('\nCommands:');
      console.log('  status [YYYY-MM-DD] [lang]  - ask deployment status');
      console.log('  reasons [lang]              - list reasons for locale');
      console.log('  exit|quit                   - stop client and server');
      return prompt();
    }

    console.log('Unknown command. Type help');
    return prompt();
  });
}

console.log('Starting stdio client — launching server (npm run start-stdio)');
console.log('Type help for commands.');
prompt();

#!/usr/bin/env node

// Minimal conversion of mcp-server to TypeScript (uses require for SDK to avoid typing the SDK)

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

import { canDeployToday, getDeploymentReasons } from './lib/deployment-logic';

const server = new Server(
  {
    name: 'estcequonmetenprod',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_deployment_status',
        description: "Vérifie si on peut mettre en production aujourd'hui selon le jour de la semaine. Retourne une décision (yes/caution/blocked/no) avec une raison drôle. Accepts optional 'lang' argument (e.g. 'en', 'fr').",
        inputSchema: {
          type: 'object',
          properties: { lang: { type: 'string' } },
          required: []
        }
      },
      {
        name: 'get_deployment_reasons',
        description: 'Retourne la liste complète des raisons possibles pour chaque type de décision (yes, caution, blocked, no). Accepts optional \u0027lang\u0027 argument.',
        inputSchema: {
          type: 'object',
          properties: { lang: { type: 'string' } },
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  if (name === 'check_deployment_status') {
    const lang = args && args.lang ? args.lang : undefined;
    const result = canDeployToday(lang);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  if (name === 'get_deployment_reasons') {
    const lang = args && args.lang ? args.lang : undefined;
    const reasons = getDeploymentReasons(lang);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(reasons, null, 2)
        }
      ]
    };
  }

  throw new Error(`Outil inconnu: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Serveur MCP 'estcequonmetenprod' démarré sur stdio");
}

main().catch((error: any) => {
  console.error('Erreur du serveur MCP:', error);
  process.exit(1);
});

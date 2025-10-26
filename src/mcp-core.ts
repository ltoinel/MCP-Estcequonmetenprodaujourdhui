import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canDeployToday, getDeploymentReasons } from './lib/deployment-logic';

/**
 * Creates and configures an MCP server instance with deployment tools.
 *
 * This centralised factory is consumed by both the stdio and HTTP servers so
 * they share the exact same tool handlers and behaviour.
 */

export function createServerInstance(): Server {
  const server = new Server(
    {
      name: 'estcequonmetenprodaujourdhui',
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
          description: "Checks if deployment is allowed today based on the day of the week. Returns a decision (yes/caution/blocked/no) with a humorous reason. Accepts optional 'lang' argument (e.g. 'en', 'fr').",
          inputSchema: {
            type: 'object',
            properties: { lang: { type: 'string' } },
            required: []
          }
        },
        {
          name: 'get_deployment_reasons',
          description: "Returns the complete list of possible reasons for each decision type (yes, caution, blocked, no). Accepts optional 'lang' argument.",
          inputSchema: {
            type: 'object',
            properties: { lang: { type: 'string' } },
            required: []
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { params } = request;
    const { name, arguments: args } = params;

    if (name === 'check_deployment_status') {
      const lang = args?.lang as string | undefined;
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
      const lang = args?.lang as string | undefined;
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

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}

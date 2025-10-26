import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canDeployToday, getDeploymentReasons } from './lib/deployment-logic';

/**
 * @fileoverview
 * Factory for creating and configuring the MCP server instance with deployment tools.
 * This module is used by both the stdio and HTTP servers to ensure consistent tool handling.
 *
 * Clean code best practices:
 * - All tool definitions and handlers are centralized here
 * - Each tool is described with input schema and documentation
 * - Unknown tools throw explicit errors
 */

/**
 * Creates and configures an MCP server instance with deployment tools.
 *
 * @returns {Server} Configured MCP server instance
 */
export function createServerInstance(): Server {
  // Instantiate the MCP server with metadata
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

  /**
   * Handler for listing available tools (MCP protocol requirement)
   * Returns the list of tools with their schemas and descriptions
   */
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

  /**
   * Handler for tool invocation (MCP protocol requirement)
   * Dispatches to the correct tool based on the 'name' field
   * Throws an error for unknown tools
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { params } = request;
    const { name, arguments: args } = params;

    // Tool: check_deployment_status
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

    // Tool: get_deployment_reasons
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

    // Unknown tool: throw explicit error
    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}

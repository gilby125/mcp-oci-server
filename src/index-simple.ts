#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OCIConfigService } from './services/oci-config.js';
import { OCIClientService } from './services/oci-client-simple.js';
import { computeTools, handleComputeTools } from './tools/compute-tools-simple.js';
import { networkingTools, handleNetworkingTools } from './tools/networking-tools.js';
import { storageTools, handleStorageTools } from './tools/storage-tools.js';
import { resourceTools, handleResourceTools } from './tools/resource-tools.js';

class OCIMCPServer {
  private server: Server;
  private ociClient: OCIClientService;

  constructor() {
    this.server = new Server(
      {
        name: 'oci-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupOCIClient();
    this.setupHandlers();
  }

  private setupOCIClient(): void {
    try {
      // Try to load from environment variables first, then fall back to config file
      let configService: OCIConfigService;
      
      if (process.env.OCI_TENANCY) {
        configService = OCIConfigService.fromEnvironment();
      } else {
        configService = new OCIConfigService();
      }

      this.ociClient = new OCIClientService(configService);
    } catch (error) {
      console.error('Failed to initialize OCI client:', error);
      process.exit(1);
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...computeTools,
          ...networkingTools,
          ...storageTools,
          ...resourceTools,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        // Route to appropriate tool handler
        if (computeTools.some(tool => tool.name === name)) {
          result = await handleComputeTools(name, args || {}, this.ociClient);
        } else if (networkingTools.some(tool => tool.name === name)) {
          result = await handleNetworkingTools(name, args || {}, this.ociClient);
        } else if (storageTools.some(tool => tool.name === name)) {
          result = await handleStorageTools(name, args || {}, this.ociClient);
        } else if (resourceTools.some(tool => tool.name === name)) {
          result = await handleResourceTools(name, args || {}, this.ociClient);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log server info to stderr so it doesn't interfere with MCP protocol
    console.error('OCI MCP Server running on stdio');
    console.error('Available tools:', [
      ...computeTools.map(t => t.name),
      ...networkingTools.map(t => t.name),
      ...storageTools.map(t => t.name),
      ...resourceTools.map(t => t.name),
    ].join(', '));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
const server = new OCIMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Simple test tools for the MCP server
const testTools: Tool[] = [
  {
    name: 'list_oci_resources',
    description: 'List OCI resources (mock implementation for testing)',
    inputSchema: {
      type: 'object',
      properties: {
        resourceType: {
          type: 'string',
          description: 'Type of resource to list (instances, clusters, vcns)',
          enum: ['instances', 'clusters', 'vcns'],
        },
      },
      required: ['resourceType'],
    },
  },
  {
    name: 'get_oci_info',
    description: 'Get OCI configuration information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

class SimpleOCIMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'simple-oci-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: testTools,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'list_oci_resources':
            result = this.mockListResources(args?.resourceType);
            break;
          case 'get_oci_info':
            result = this.mockGetOCIInfo();
            break;
          default:
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

  private mockListResources(resourceType: string) {
    switch (resourceType) {
      case 'instances':
        return [
          {
            id: 'ocid1.instance.oc1.iad.example1',
            displayName: 'web-server-1',
            lifecycleState: 'RUNNING',
            shape: 'VM.Standard2.1',
            availabilityDomain: 'AD-1',
          },
          {
            id: 'ocid1.instance.oc1.iad.example2',
            displayName: 'database-server',
            lifecycleState: 'STOPPED',
            shape: 'VM.Standard2.2',
            availabilityDomain: 'AD-2',
          },
        ];
      case 'clusters':
        return [
          {
            id: 'ocid1.cluster.oc1.iad.example1',
            name: 'production-cluster',
            kubernetesVersion: 'v1.28.2',
            lifecycleState: 'ACTIVE',
            nodeCount: 3,
          },
        ];
      case 'vcns':
        return [
          {
            id: 'ocid1.vcn.oc1.iad.example1',
            displayName: 'main-vcn',
            cidrBlock: '10.0.0.0/16',
            lifecycleState: 'AVAILABLE',
          },
        ];
      default:
        return { error: `Unknown resource type: ${resourceType}` };
    }
  }

  private mockGetOCIInfo() {
    return {
      server: 'OCI MCP Server',
      version: '1.0.0',
      capabilities: [
        'Compute instance management',
        'Kubernetes cluster operations',
        'Network resource discovery',
        'Storage management',
        'Container operations (OKE)',
      ],
      status: 'Mock mode - for testing purposes',
      configuration: {
        region: process.env.OCI_REGION || 'us-ashburn-1',
        authenticated: !!process.env.OCI_TENANCY,
      },
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log server info to stderr so it doesn't interfere with MCP protocol
    console.error('Simple OCI MCP Server running on stdio');
    console.error('Available tools:', testTools.map(t => t.name).join(', '));
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
const server = new SimpleOCIMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
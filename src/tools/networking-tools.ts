import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OCIClientService } from '../services/oci-client-simple.js';

export const listVcnsTool: Tool = {
  name: 'list_vcns',
  description: 'List all Virtual Cloud Networks (VCNs) in a compartment',
  inputSchema: {
    type: 'object',
    properties: {
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
    },
  },
};

export const listSubnetsTool: Tool = {
  name: 'list_subnets',
  description: 'List all subnets in a compartment or VCN',
  inputSchema: {
    type: 'object',
    properties: {
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
      vcnId: {
        type: 'string',
        description: 'Optional VCN ID to filter subnets by specific VCN',
      },
    },
  },
};

export async function handleNetworkingTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  switch (toolName) {
    case 'list_vcns':
      return await ociClient.listVcns(args.compartmentId);

    case 'list_subnets':
      return await ociClient.listSubnets(args.compartmentId, args.vcnId);

    default:
      throw new Error(`Unknown networking tool: ${toolName}`);
  }
}

export const networkingTools = [
  listVcnsTool,
  listSubnetsTool,
];
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OCIClientService } from '../services/oci-client-simple.js';

export const listCompartmentsTool: Tool = {
  name: 'list_compartments',
  description: 'List all compartments in the tenancy',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleResourceTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  switch (toolName) {
    case 'list_compartments':
      return await ociClient.listCompartments();

    default:
      throw new Error(`Unknown resource tool: ${toolName}`);
  }
}

export const resourceTools = [
  listCompartmentsTool,
];
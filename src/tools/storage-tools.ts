import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OCIClientService } from '../services/oci-client-simple.js';

export const listVolumesTool: Tool = {
  name: 'list_volumes',
  description: 'List all block volumes in a compartment',
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

export async function handleStorageTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  switch (toolName) {
    case 'list_volumes':
      return await ociClient.listVolumes(args.compartmentId);

    default:
      throw new Error(`Unknown storage tool: ${toolName}`);
  }
}

export const storageTools = [
  listVolumesTool,
];
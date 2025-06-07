import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OCIClientService } from '../services/oci-client-simple.js';
import { OCIConfigService } from '../services/oci-config.js';

// Read-only compute tools (safe operations only)
export const listInstancesTool: Tool = {
  name: 'list_instances',
  description: 'List all compute instances in a compartment (read-only)',
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

export const getInstanceTool: Tool = {
  name: 'get_instance',
  description: 'Get details of a specific compute instance (read-only)',
  inputSchema: {
    type: 'object',
    properties: {
      instanceId: {
        type: 'string',
        description: 'The OCID of the instance to retrieve',
      },
    },
    required: ['instanceId'],
  },
};

export const listShapesTool: Tool = {
  name: 'list_shapes',
  description: 'List available compute shapes in a compartment (read-only)',
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

export const listImagesTool: Tool = {
  name: 'list_images',
  description: 'List available images in a compartment (read-only)',
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

export const listAvailabilityDomainsTool: Tool = {
  name: 'list_availability_domains',
  description: 'List availability domains in a compartment (read-only)',
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

// Destructive operations for full mode only
export const terminateInstanceTool: Tool = {
  name: 'terminate_instance',
  description: 'Terminate a compute instance (DESTRUCTIVE - requires full mode)',
  inputSchema: {
    type: 'object',
    properties: {
      instanceId: {
        type: 'string',
        description: 'The OCID of the instance to terminate',
      },
    },
    required: ['instanceId'],
  },
};

export async function handleComputeTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  const isReadOnly = OCIConfigService.isReadOnlyMode();

  switch (toolName) {
    case 'list_instances':
      return await ociClient.listInstances(args.compartmentId);

    case 'get_instance':
      return await ociClient.getInstance(args.instanceId);

    case 'list_shapes':
      return await ociClient.listShapes(args.compartmentId);

    case 'list_images':
      return await ociClient.listImages(args.compartmentId);

    case 'list_availability_domains':
      return await ociClient.listAvailabilityDomains(args.compartmentId);

    case 'terminate_instance':
      if (isReadOnly) {
        return {
          error: 'PERMISSION_DENIED',
          message: 'Destructive operations are disabled in read-only mode. Set OCI_MCP_READ_ONLY=false to enable.',
          tool: toolName,
          mode: 'read-only'
        };
      }
      await ociClient.terminateInstance(args.instanceId);
      return { message: `Instance ${args.instanceId} termination initiated` };

    default:
      throw new Error(`Unknown compute tool: ${toolName}`);
  }
}

export function getComputeTools(): Tool[] {
  const readOnlyTools = [
    listInstancesTool,
    getInstanceTool,
    listShapesTool,
    listImagesTool,
    listAvailabilityDomainsTool,
  ];

  const destructiveTools = [
    terminateInstanceTool,
  ];

  const isReadOnly = OCIConfigService.isReadOnlyMode();
  
  if (isReadOnly) {
    return readOnlyTools;
  } else {
    return [...readOnlyTools, ...destructiveTools];
  }
}
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { OCIClientService } from '../services/oci-client.js';

export const listInstancesTool: Tool = {
  name: 'list_instances',
  description: 'List all compute instances in a compartment',
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
  description: 'Get details of a specific compute instance',
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

export const launchInstanceTool: Tool = {
  name: 'launch_instance',
  description: 'Launch a new compute instance',
  inputSchema: {
    type: 'object',
    properties: {
      displayName: {
        type: 'string',
        description: 'A user-friendly name for the instance',
      },
      availabilityDomain: {
        type: 'string',
        description: 'The availability domain to launch the instance in',
      },
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
      shape: {
        type: 'string',
        description: 'The shape of the instance (e.g., VM.Standard2.1)',
      },
      imageId: {
        type: 'string',
        description: 'The OCID of the image to use',
      },
      subnetId: {
        type: 'string',
        description: 'The OCID of the subnet to place the instance in',
      },
    },
    required: ['displayName', 'availabilityDomain', 'shape', 'imageId', 'subnetId'],
  },
};

export const terminateInstanceTool: Tool = {
  name: 'terminate_instance',
  description: 'Terminate a compute instance',
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

export const listShapesTool: Tool = {
  name: 'list_shapes',
  description: 'List available compute shapes in a compartment',
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
  description: 'List available images in a compartment',
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
  description: 'List availability domains in a compartment',
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

export async function handleComputeTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  switch (toolName) {
    case 'list_instances':
      return await ociClient.listInstances(args.compartmentId);

    case 'get_instance':
      return await ociClient.getInstance(args.instanceId);

    case 'launch_instance':
      return await ociClient.launchInstance({
        displayName: args.displayName,
        availabilityDomain: args.availabilityDomain,
        compartmentId: args.compartmentId,
        shape: args.shape,
        imageId: args.imageId,
        subnetId: args.subnetId,
      });

    case 'terminate_instance':
      await ociClient.terminateInstance(args.instanceId);
      return { message: `Instance ${args.instanceId} termination initiated` };

    case 'list_shapes':
      return await ociClient.listShapes(args.compartmentId);

    case 'list_images':
      return await ociClient.listImages(args.compartmentId);

    case 'list_availability_domains':
      return await ociClient.listAvailabilityDomains(args.compartmentId);

    default:
      throw new Error(`Unknown compute tool: ${toolName}`);
  }
}

export const computeTools = [
  listInstancesTool,
  getInstanceTool,
  launchInstanceTool,
  terminateInstanceTool,
  listShapesTool,
  listImagesTool,
  listAvailabilityDomainsTool,
];
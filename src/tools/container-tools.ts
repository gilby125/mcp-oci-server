import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OCIClientService } from '../services/oci-client.js';

export const listClustersTool: Tool = {
  name: 'list_clusters',
  description: 'List all Kubernetes clusters in a compartment',
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

export const getClusterTool: Tool = {
  name: 'get_cluster',
  description: 'Get details of a specific Kubernetes cluster',
  inputSchema: {
    type: 'object',
    properties: {
      clusterId: {
        type: 'string',
        description: 'The OCID of the cluster to retrieve',
      },
    },
    required: ['clusterId'],
  },
};

export const createClusterTool: Tool = {
  name: 'create_cluster',
  description: 'Create a new Kubernetes cluster',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'A user-friendly name for the cluster',
      },
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
      vcnId: {
        type: 'string',
        description: 'The OCID of the VCN to place the cluster in',
      },
      kubernetesVersion: {
        type: 'string',
        description: 'The Kubernetes version for the cluster (e.g., v1.28.2)',
      },
      subnetId: {
        type: 'string',
        description: 'The OCID of the subnet for the cluster endpoint',
      },
      isPublicIpEnabled: {
        type: 'boolean',
        description: 'Whether to enable public IP for the cluster endpoint',
        default: false,
      },
    },
    required: ['name', 'vcnId', 'kubernetesVersion', 'subnetId'],
  },
};

export const deleteClusterTool: Tool = {
  name: 'delete_cluster',
  description: 'Delete a Kubernetes cluster',
  inputSchema: {
    type: 'object',
    properties: {
      clusterId: {
        type: 'string',
        description: 'The OCID of the cluster to delete',
      },
    },
    required: ['clusterId'],
  },
};

export const listNodePoolsTool: Tool = {
  name: 'list_node_pools',
  description: 'List all node pools in a compartment or cluster',
  inputSchema: {
    type: 'object',
    properties: {
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
      clusterId: {
        type: 'string',
        description: 'Optional cluster ID to filter node pools by specific cluster',
      },
    },
  },
};

export const getNodePoolTool: Tool = {
  name: 'get_node_pool',
  description: 'Get details of a specific node pool',
  inputSchema: {
    type: 'object',
    properties: {
      nodePoolId: {
        type: 'string',
        description: 'The OCID of the node pool to retrieve',
      },
    },
    required: ['nodePoolId'],
  },
};

export const createNodePoolTool: Tool = {
  name: 'create_node_pool',
  description: 'Create a new node pool in a Kubernetes cluster',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'A user-friendly name for the node pool',
      },
      clusterId: {
        type: 'string',
        description: 'The OCID of the cluster to create the node pool in',
      },
      compartmentId: {
        type: 'string',
        description: 'Optional compartment ID. Uses default if not provided.',
      },
      kubernetesVersion: {
        type: 'string',
        description: 'The Kubernetes version for the node pool',
      },
      nodeShape: {
        type: 'string',
        description: 'The shape of the nodes (e.g., VM.Standard2.1)',
      },
      size: {
        type: 'number',
        description: 'The number of nodes in the node pool',
      },
      availabilityDomain: {
        type: 'string',
        description: 'The availability domain for the nodes',
      },
      subnetId: {
        type: 'string',
        description: 'The OCID of the subnet for the nodes',
      },
    },
    required: ['name', 'clusterId', 'kubernetesVersion', 'nodeShape', 'size', 'availabilityDomain', 'subnetId'],
  },
};

export const deleteNodePoolTool: Tool = {
  name: 'delete_node_pool',
  description: 'Delete a node pool',
  inputSchema: {
    type: 'object',
    properties: {
      nodePoolId: {
        type: 'string',
        description: 'The OCID of the node pool to delete',
      },
    },
    required: ['nodePoolId'],
  },
};

export const getKubeconfigTool: Tool = {
  name: 'get_kubeconfig',
  description: 'Get the kubeconfig file for a Kubernetes cluster',
  inputSchema: {
    type: 'object',
    properties: {
      clusterId: {
        type: 'string',
        description: 'The OCID of the cluster to get kubeconfig for',
      },
    },
    required: ['clusterId'],
  },
};

export async function handleContainerTools(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any> {
  switch (toolName) {
    case 'list_clusters':
      return await ociClient.listClusters(args.compartmentId);

    case 'get_cluster':
      return await ociClient.getCluster(args.clusterId);

    case 'create_cluster':
      return await ociClient.createCluster({
        name: args.name,
        compartmentId: args.compartmentId,
        vcnId: args.vcnId,
        kubernetesVersion: args.kubernetesVersion,
        subnetId: args.subnetId,
        isPublicIpEnabled: args.isPublicIpEnabled,
      });

    case 'delete_cluster':
      await ociClient.deleteCluster(args.clusterId);
      return { message: `Cluster ${args.clusterId} deletion initiated` };

    case 'list_node_pools':
      return await ociClient.listNodePools(args.compartmentId, args.clusterId);

    case 'get_node_pool':
      return await ociClient.getNodePool(args.nodePoolId);

    case 'create_node_pool':
      return await ociClient.createNodePool({
        name: args.name,
        clusterId: args.clusterId,
        compartmentId: args.compartmentId,
        kubernetesVersion: args.kubernetesVersion,
        nodeShape: args.nodeShape,
        size: args.size,
        availabilityDomain: args.availabilityDomain,
        subnetId: args.subnetId,
      });

    case 'delete_node_pool':
      await ociClient.deleteNodePool(args.nodePoolId);
      return { message: `Node pool ${args.nodePoolId} deletion initiated` };

    case 'get_kubeconfig':
      const kubeconfig = await ociClient.getClusterKubeconfig(args.clusterId);
      return { 
        kubeconfig,
        message: 'Kubeconfig retrieved successfully. Save this to ~/.kube/config to use with kubectl.'
      };

    default:
      throw new Error(`Unknown container tool: ${toolName}`);
  }
}

export const containerTools = [
  listClustersTool,
  getClusterTool,
  createClusterTool,
  deleteClusterTool,
  listNodePoolsTool,
  getNodePoolTool,
  createNodePoolTool,
  deleteNodePoolTool,
  getKubeconfigTool,
];
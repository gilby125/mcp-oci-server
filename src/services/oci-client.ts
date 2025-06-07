import { 
  common,
  core,
  identity,
  containerengine
} from 'oci-sdk';
import { OCIConfigService } from './oci-config.js';
import { 
  ComputeInstance, 
  VCN, 
  Subnet, 
  BlockVolume, 
  Compartment,
  InstanceShape,
  AvailabilityDomain,
  Image,
  Cluster,
  NodePool,
  ContainerImage
} from '../types/oci.js';

export class OCIClientService {
  private provider: common.AuthenticationDetailsProvider;
  private computeClient: core.ComputeClient;
  private virtualNetworkClient: core.VirtualNetworkClient;
  private blockstorageClient: core.BlockstorageClient;
  private identityClient: identity.IdentityClient;
  private containerEngineClient: containerengine.ContainerEngineClient;
  private configService: OCIConfigService;

  constructor(configService: OCIConfigService) {
    this.configService = configService;
    this.initializeClients();
  }

  private initializeClients(): void {
    this.provider = this.createAuthProvider();

    this.computeClient = new core.ComputeClient({
      authenticationDetailsProvider: this.provider,
    });

    this.virtualNetworkClient = new core.VirtualNetworkClient({
      authenticationDetailsProvider: this.provider,
    });

    this.blockstorageClient = new core.BlockstorageClient({
      authenticationDetailsProvider: this.provider,
    });

    this.identityClient = new identity.IdentityClient({
      authenticationDetailsProvider: this.provider,
    });

    this.containerEngineClient = new containerengine.ContainerEngineClient({
      authenticationDetailsProvider: this.provider,
    });
  }

  private createAuthProvider(): common.AuthenticationDetailsProvider {
    // Try config file auth first (includes session auth if available)
    try {
      return new common.ConfigFileAuthenticationDetailsProvider();
    } catch (configError) {
      // Fall back to simple auth with config service if we have environment variables
      if (this.configService.isConfigured()) {
        const config = this.configService.getConfig();
        return new common.SimpleAuthenticationDetailsProvider(
          config.tenancy,
          config.user,
          config.fingerprint,
          config.key,
          null, // passphrase
          config.region as any // Type assertion for region
        );
      }
      throw new Error(`Failed to initialize OCI authentication. Config file error: ${configError.message}. Please ensure either ~/.oci/config exists or set environment variables.`);
    }
  }

  // Compute Operations
  async listInstances(compartmentId?: string): Promise<ComputeInstance[]> {
    const cId = compartmentId || this.configService.getCompartmentId();
    
    const request: core.requests.ListInstancesRequest = {
      compartmentId: cId,
    };

    const response = await this.computeClient.listInstances(request);
    
    return response.items.map(instance => ({
      id: instance.id!,
      displayName: instance.displayName!,
      lifecycleState: String(instance.lifecycleState),
      availabilityDomain: instance.availabilityDomain!,
      shape: instance.shape!,
      compartmentId: instance.compartmentId!,
      timeCreated: instance.timeCreated!.toISOString(),
    }));
  }

  async getInstance(instanceId: string): Promise<ComputeInstance> {
    const request: core.requests.GetInstanceRequest = {
      instanceId,
    };

    const response = await this.computeClient.getInstance(request);
    const instance = response.instance;

    return {
      id: instance.id!,
      displayName: instance.displayName!,
      lifecycleState: String(instance.lifecycleState),
      availabilityDomain: instance.availabilityDomain!,
      shape: instance.shape!,
      compartmentId: instance.compartmentId!,
      timeCreated: instance.timeCreated!.toISOString(),
    };
  }

  async launchInstance(params: {
    availabilityDomain: string;
    compartmentId?: string;
    shape: string;
    imageId: string;
    subnetId: string;
    displayName: string;
  }): Promise<ComputeInstance> {
    const cId = params.compartmentId || this.configService.getCompartmentId();

    const launchDetails: core.models.LaunchInstanceDetails = {
      availabilityDomain: params.availabilityDomain,
      compartmentId: cId,
      shape: params.shape,
      imageId: params.imageId,
      displayName: params.displayName,
      createVnicDetails: {
        subnetId: params.subnetId,
      },
    };

    const request: core.requests.LaunchInstanceRequest = {
      launchInstanceDetails: launchDetails,
    };

    const response = await this.computeClient.launchInstance(request);
    const instance = response.instance;

    return {
      id: instance.id,
      displayName: instance.displayName,
      lifecycleState: instance.lifecycleState,
      availabilityDomain: instance.availabilityDomain,
      shape: instance.shape,
      compartmentId: instance.compartmentId,
      timeCreated: instance.timeCreated.toISOString(),
    };
  }

  async terminateInstance(instanceId: string): Promise<void> {
    const request: core.requests.TerminateInstanceRequest = {
      instanceId,
    };

    await this.computeClient.terminateInstance(request);
  }

  // Networking Operations
  async listVcns(compartmentId?: string): Promise<VCN[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListVcnsRequest = {
      compartmentId: cId,
    };

    const response = await this.virtualNetworkClient.listVcns(request);

    return response.items.map(vcn => ({
      id: vcn.id,
      displayName: vcn.displayName,
      cidrBlock: vcn.cidrBlock,
      lifecycleState: vcn.lifecycleState,
      compartmentId: vcn.compartmentId,
      timeCreated: vcn.timeCreated.toISOString(),
    }));
  }

  async listSubnets(compartmentId?: string, vcnId?: string): Promise<Subnet[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListSubnetsRequest = {
      compartmentId: cId,
      vcnId,
    };

    const response = await this.virtualNetworkClient.listSubnets(request);

    return response.items.map(subnet => ({
      id: subnet.id,
      displayName: subnet.displayName,
      cidrBlock: subnet.cidrBlock,
      availabilityDomain: subnet.availabilityDomain,
      vcnId: subnet.vcnId,
      lifecycleState: subnet.lifecycleState,
      compartmentId: subnet.compartmentId,
    }));
  }

  // Storage Operations
  async listVolumes(compartmentId?: string): Promise<BlockVolume[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListVolumesRequest = {
      compartmentId: cId,
    };

    const response = await this.blockstorageClient.listVolumes(request);

    return response.items.map(volume => ({
      id: volume.id,
      displayName: volume.displayName,
      sizeInGBs: volume.sizeInGBs,
      lifecycleState: volume.lifecycleState,
      availabilityDomain: volume.availabilityDomain,
      compartmentId: volume.compartmentId,
      timeCreated: volume.timeCreated.toISOString(),
    }));
  }

  // Identity Operations
  async listCompartments(): Promise<Compartment[]> {
    const tenancyId = this.configService.getConfig().tenancy;

    const request: identity.requests.ListCompartmentsRequest = {
      compartmentId: tenancyId,
    };

    const response = await this.identityClient.listCompartments(request);

    return response.items.map(compartment => ({
      id: compartment.id,
      name: compartment.name,
      description: compartment.description,
      lifecycleState: compartment.lifecycleState,
      timeCreated: compartment.timeCreated.toISOString(),
    }));
  }

  async listAvailabilityDomains(compartmentId?: string): Promise<AvailabilityDomain[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: identity.requests.ListAvailabilityDomainsRequest = {
      compartmentId: cId,
    };

    const response = await this.identityClient.listAvailabilityDomains(request);

    return response.items.map(ad => ({
      name: ad.name,
      compartmentId: ad.compartmentId,
      id: ad.id,
    }));
  }

  async listShapes(compartmentId?: string): Promise<InstanceShape[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListShapesRequest = {
      compartmentId: cId,
    };

    const response = await this.computeClient.listShapes(request);

    return response.items.map(shape => ({
      shape: shape.shape,
      processorDescription: shape.processorDescription || '',
      ocpus: shape.ocpus || 0,
      memoryInGBs: shape.memoryInGBs || 0,
      gpus: shape.gpus || 0,
      maxVnicAttachments: shape.maxVnicAttachments || 0,
      networkingBandwidthInGbps: shape.networkingBandwidthInGbps || 0,
    }));
  }

  async listImages(compartmentId?: string): Promise<Image[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListImagesRequest = {
      compartmentId: cId,
    };

    const response = await this.computeClient.listImages(request);

    return response.items.map(image => ({
      id: image.id,
      displayName: image.displayName,
      operatingSystem: image.operatingSystem,
      operatingSystemVersion: image.operatingSystemVersion,
      lifecycleState: image.lifecycleState,
      compartmentId: image.compartmentId,
      timeCreated: image.timeCreated.toISOString(),
    }));
  }

  // Container Engine Operations
  async listClusters(compartmentId?: string): Promise<Cluster[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: containerengine.requests.ListClustersRequest = {
      compartmentId: cId,
    };

    const response = await this.containerEngineClient.listClusters(request);

    return response.items.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      kubernetesVersion: cluster.kubernetesVersion,
      lifecycleState: cluster.lifecycleState,
      compartmentId: cluster.compartmentId,
      vcnId: cluster.vcnId,
      endpointConfig: {
        subnetId: cluster.endpointConfig?.subnetId || '',
        isPublicIpEnabled: cluster.endpointConfig?.isPublicIpEnabled || false,
      },
      timeCreated: cluster.metadata?.timeCreated?.toISOString() || '',
      timeUpdated: cluster.metadata?.timeUpdated?.toISOString(),
    }));
  }

  async getCluster(clusterId: string): Promise<Cluster> {
    const request: containerengine.requests.GetClusterRequest = {
      clusterId,
    };

    const response = await this.containerEngineClient.getCluster(request);
    const cluster = response.cluster;

    return {
      id: cluster.id,
      name: cluster.name,
      kubernetesVersion: cluster.kubernetesVersion,
      lifecycleState: cluster.lifecycleState,
      compartmentId: cluster.compartmentId,
      vcnId: cluster.vcnId,
      endpointConfig: {
        subnetId: cluster.endpointConfig?.subnetId || '',
        isPublicIpEnabled: cluster.endpointConfig?.isPublicIpEnabled || false,
      },
      timeCreated: cluster.metadata?.timeCreated?.toISOString() || '',
      timeUpdated: cluster.metadata?.timeUpdated?.toISOString(),
    };
  }

  async createCluster(params: {
    name: string;
    compartmentId?: string;
    vcnId: string;
    kubernetesVersion: string;
    subnetId: string;
    isPublicIpEnabled?: boolean;
  }): Promise<Cluster> {
    const cId = params.compartmentId || this.configService.getCompartmentId();

    const createClusterDetails: containerengine.models.CreateClusterDetails = {
      name: params.name,
      compartmentId: cId,
      vcnId: params.vcnId,
      kubernetesVersion: params.kubernetesVersion,
      endpointConfig: {
        subnetId: params.subnetId,
        isPublicIpEnabled: params.isPublicIpEnabled || false,
      },
    };

    const request: containerengine.requests.CreateClusterRequest = {
      createClusterDetails,
    };

    const response = await this.containerEngineClient.createCluster(request);
    
    // Since the response now only contains work request ID, we need to wait or return a work request response
    // For now, we'll throw an error indicating this needs to be updated to handle async operations
    throw new Error('Create cluster now returns work request ID. Use work request operations to track status.');
  }

  async deleteCluster(clusterId: string): Promise<void> {
    const request: containerengine.requests.DeleteClusterRequest = {
      clusterId,
    };

    await this.containerEngineClient.deleteCluster(request);
  }

  async listNodePools(compartmentId?: string, clusterId?: string): Promise<NodePool[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: containerengine.requests.ListNodePoolsRequest = {
      compartmentId: cId,
      clusterId,
    };

    const response = await this.containerEngineClient.listNodePools(request);

    return response.items.map(nodePool => ({
      id: nodePool.id,
      name: nodePool.name,
      kubernetesVersion: nodePool.kubernetesVersion,
      lifecycleState: nodePool.lifecycleState,
      clusterId: nodePool.clusterId,
      compartmentId: nodePool.compartmentId,
      nodeShape: nodePool.nodeShape,
      nodeConfigDetails: {
        size: nodePool.nodeConfigDetails?.size || 0,
        placementConfigs: nodePool.nodeConfigDetails?.placementConfigs?.map(config => ({
          availabilityDomain: config.availabilityDomain,
          subnetId: config.subnetId,
        })) || [],
      },
      // timeCreated is no longer available in NodePoolSummary
    }));
  }

  async getNodePool(nodePoolId: string): Promise<NodePool> {
    const request: containerengine.requests.GetNodePoolRequest = {
      nodePoolId,
    };

    const response = await this.containerEngineClient.getNodePool(request);
    const nodePool = response.nodePool;

    return {
      id: nodePool.id,
      name: nodePool.name,
      kubernetesVersion: nodePool.kubernetesVersion,
      lifecycleState: nodePool.lifecycleState,
      clusterId: nodePool.clusterId,
      compartmentId: nodePool.compartmentId,
      nodeShape: nodePool.nodeShape,
      nodeConfigDetails: {
        size: nodePool.nodeConfigDetails?.size || 0,
        placementConfigs: nodePool.nodeConfigDetails?.placementConfigs?.map(config => ({
          availabilityDomain: config.availabilityDomain,
          subnetId: config.subnetId,
        })) || [],
      },
      // timeCreated is no longer available in NodePool
    };
  }

  async createNodePool(params: {
    name: string;
    clusterId: string;
    compartmentId?: string;
    kubernetesVersion: string;
    nodeShape: string;
    size: number;
    availabilityDomain: string;
    subnetId: string;
  }): Promise<NodePool> {
    const cId = params.compartmentId || this.configService.getCompartmentId();

    const createNodePoolDetails: containerengine.models.CreateNodePoolDetails = {
      name: params.name,
      clusterId: params.clusterId,
      compartmentId: cId,
      kubernetesVersion: params.kubernetesVersion,
      nodeShape: params.nodeShape,
      nodeConfigDetails: {
        size: params.size,
        placementConfigs: [{
          availabilityDomain: params.availabilityDomain,
          subnetId: params.subnetId,
        }],
      },
    };

    const request: containerengine.requests.CreateNodePoolRequest = {
      createNodePoolDetails,
    };

    const response = await this.containerEngineClient.createNodePool(request);
    
    // Since the response now only contains work request ID, we need to wait or return a work request response
    // For now, we'll throw an error indicating this needs to be updated to handle async operations
    throw new Error('Create node pool now returns work request ID. Use work request operations to track status.');
  }

  async deleteNodePool(nodePoolId: string): Promise<void> {
    const request: containerengine.requests.DeleteNodePoolRequest = {
      nodePoolId,
    };

    await this.containerEngineClient.deleteNodePool(request);
  }

  async getClusterKubeconfig(clusterId: string): Promise<string> {
    const request: containerengine.requests.CreateKubeconfigRequest = {
      clusterId,
    };

    const response = await this.containerEngineClient.createKubeconfig(request);
    // Convert the stream/ReadableStream to string
    if (response.value instanceof ReadableStream) {
      const reader = response.value.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }
      
      return new TextDecoder().decode(concatenated);
    } else {
      // For Node.js stream.Readable - check if it has the 'on' method
      const stream = response.value as any;
      if (stream && typeof stream.on === 'function') {
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
          stream.on('error', reject);
        });
      } else {
        throw new Error('Unsupported stream type for kubeconfig response');
      }
    }
  }
}
import { 
  common,
  core,
  identity
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
  Image
} from '../types/oci.js';

export class OCIClientService {
  private provider: common.AuthenticationDetailsProvider;
  private computeClient: core.ComputeClient;
  private virtualNetworkClient: core.VirtualNetworkClient;
  private blockstorageClient: core.BlockstorageClient;
  private identityClient: identity.IdentityClient;
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
      id: vcn.id!,
      displayName: vcn.displayName!,
      cidrBlock: vcn.cidrBlock!,
      lifecycleState: String(vcn.lifecycleState),
      compartmentId: vcn.compartmentId!,
      timeCreated: vcn.timeCreated ? vcn.timeCreated.toISOString() : '',
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
      id: subnet.id!,
      displayName: subnet.displayName!,
      cidrBlock: subnet.cidrBlock!,
      availabilityDomain: subnet.availabilityDomain || '',
      vcnId: subnet.vcnId!,
      lifecycleState: String(subnet.lifecycleState),
      compartmentId: subnet.compartmentId!,
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
      id: volume.id!,
      displayName: volume.displayName!,
      sizeInGBs: volume.sizeInGBs || 0,
      lifecycleState: String(volume.lifecycleState),
      availabilityDomain: volume.availabilityDomain!,
      compartmentId: volume.compartmentId!,
      timeCreated: volume.timeCreated!.toISOString(),
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
      id: compartment.id!,
      name: compartment.name!,
      description: compartment.description!,
      lifecycleState: String(compartment.lifecycleState),
      timeCreated: compartment.timeCreated!.toISOString(),
    }));
  }

  async listAvailabilityDomains(compartmentId?: string): Promise<AvailabilityDomain[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: identity.requests.ListAvailabilityDomainsRequest = {
      compartmentId: cId,
    };

    const response = await this.identityClient.listAvailabilityDomains(request);

    return response.items.map(ad => ({
      name: ad.name!,
      compartmentId: ad.compartmentId!,
      id: ad.id!,
    }));
  }

  async listShapes(compartmentId?: string): Promise<InstanceShape[]> {
    const cId = compartmentId || this.configService.getCompartmentId();

    const request: core.requests.ListShapesRequest = {
      compartmentId: cId,
    };

    const response = await this.computeClient.listShapes(request);

    return response.items.map(shape => ({
      shape: shape.shape!,
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
      id: image.id!,
      displayName: image.displayName!,
      operatingSystem: image.operatingSystem!,
      operatingSystemVersion: image.operatingSystemVersion!,
      lifecycleState: String(image.lifecycleState),
      compartmentId: image.compartmentId!,
      timeCreated: image.timeCreated!.toISOString(),
    }));
  }
}
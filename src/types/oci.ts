import { z } from 'zod';

export const OCIConfigSchema = z.object({
  tenancy: z.string(),
  user: z.string(),
  fingerprint: z.string(),
  key: z.string(),
  region: z.string(),
  compartmentId: z.string().optional(),
});

export type OCIConfig = z.infer<typeof OCIConfigSchema>;

export interface ComputeInstance {
  id: string;
  displayName: string;
  lifecycleState: string;
  availabilityDomain: string;
  shape: string;
  compartmentId: string;
  timeCreated: string;
}

export interface VCN {
  id: string;
  displayName: string;
  cidrBlock: string;
  lifecycleState: string;
  compartmentId: string;
  timeCreated: string;
}

export interface Subnet {
  id: string;
  displayName: string;
  cidrBlock: string;
  availabilityDomain: string;
  vcnId: string;
  lifecycleState: string;
  compartmentId: string;
}

export interface BlockVolume {
  id: string;
  displayName: string;
  sizeInGBs: number;
  lifecycleState: string;
  availabilityDomain: string;
  compartmentId: string;
  timeCreated: string;
}

export interface Compartment {
  id: string;
  name: string;
  description: string;
  lifecycleState: string;
  timeCreated: string;
}

export interface InstanceShape {
  shape: string;
  processorDescription: string;
  ocpus: number;
  memoryInGBs: number;
  gpus: number;
  maxVnicAttachments: number;
  networkingBandwidthInGbps: number;
}

export interface AvailabilityDomain {
  name: string;
  compartmentId: string;
  id: string;
}

export interface Image {
  id: string;
  displayName: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  lifecycleState: string;
  compartmentId: string;
  timeCreated: string;
}

export interface Cluster {
  id: string;
  name: string;
  kubernetesVersion: string;
  lifecycleState: string;
  compartmentId: string;
  vcnId: string;
  endpointConfig: {
    subnetId: string;
    isPublicIpEnabled: boolean;
  };
  timeCreated: string;
  timeUpdated?: string;
}

export interface NodePool {
  id: string;
  name: string;
  kubernetesVersion: string;
  lifecycleState: string;
  clusterId: string;
  compartmentId: string;
  nodeShape: string;
  nodeConfigDetails: {
    size: number;
    placementConfigs: Array<{
      availabilityDomain: string;
      subnetId: string;
    }>;
  };
  timeCreated?: string; // Made optional as it's no longer available in the SDK
}

export interface WorkloadMapping {
  clusterId: string;
  namespace: string;
  workloadName: string;
  workloadType: string;
}

export interface ContainerImage {
  id: string;
  displayName: string;
  compartmentId: string;
  repositoryName: string;
  version: string;
  digest: string;
  timeCreated: string;
  lifecycleState: string;
}
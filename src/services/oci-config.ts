import { OCIConfig, OCIConfigSchema } from '../types/oci.js';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export class OCIConfigService {
  private config: OCIConfig | null = null;

  constructor(config?: Partial<OCIConfig>) {
    if (config) {
      this.config = this.validateConfig(config);
    } else {
      this.loadConfigFromFile();
    }
  }

  private validateConfig(config: Partial<OCIConfig>): OCIConfig {
    try {
      return OCIConfigSchema.parse(config);
    } catch (error) {
      throw new Error(`Invalid OCI configuration: ${error}`);
    }
  }

  private loadConfigFromFile(): void {
    const configPath = join(homedir(), '.oci', 'config');
    
    if (!existsSync(configPath)) {
      throw new Error(`OCI config file not found at ${configPath}. Please create it or provide config via environment variables.`);
    }

    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const parsedConfig = this.parseConfigFile(configContent);
      this.config = this.validateConfig(parsedConfig);
    } catch (error) {
      throw new Error(`Failed to load OCI config: ${error}`);
    }
  }

  private parseConfigFile(content: string): Partial<OCIConfig> {
    const lines = content.split('\n');
    const config: Record<string, string> = {};
    let currentProfile = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentProfile = trimmed.slice(1, -1);
        continue;
      }

      if (trimmed && trimmed.includes('=') && (currentProfile === 'DEFAULT' || currentProfile === '')) {
        const [key, value] = trimmed.split('=', 2);
        config[key.trim()] = value.trim();
      }
    }

    return {
      tenancy: config.tenancy,
      user: config.user,
      fingerprint: config.fingerprint,
      key: config.key_file ? readFileSync(config.key_file, 'utf-8') : undefined,
      region: config.region,
      compartmentId: config.compartment_id,
    };
  }

  public static fromEnvironment(): OCIConfigService {
    const config = {
      tenancy: process.env.OCI_TENANCY || process.env.OCI_CLI_TENANCY,
      user: process.env.OCI_USER || process.env.OCI_CLI_USER,
      fingerprint: process.env.OCI_FINGERPRINT || process.env.OCI_CLI_FINGERPRINT,
      key: process.env.OCI_PRIVATE_KEY || process.env.OCI_CLI_KEY_CONTENT,
      region: process.env.OCI_REGION || process.env.OCI_CLI_REGION,
      compartmentId: process.env.OCI_COMPARTMENT_ID || process.env.OCI_CLI_COMPARTMENT_ID,
    };

    return new OCIConfigService(config);
  }

  public static fromCLIConfig(): OCIConfigService {
    // Support for OCI CLI environment variables
    const config = {
      tenancy: process.env.OCI_CLI_TENANCY,
      user: process.env.OCI_CLI_USER,
      fingerprint: process.env.OCI_CLI_FINGERPRINT,
      key: process.env.OCI_CLI_KEY_CONTENT,
      region: process.env.OCI_CLI_REGION,
      compartmentId: process.env.OCI_CLI_COMPARTMENT_ID,
    };

    return new OCIConfigService(config);
  }

  public getConfig(): OCIConfig {
    if (!this.config) {
      throw new Error('OCI configuration not loaded');
    }
    return this.config;
  }

  public isConfigured(): boolean {
    return this.config !== null;
  }

  public getRegion(): string {
    return this.getConfig().region;
  }

  public getCompartmentId(): string {
    const config = this.getConfig();
    return config.compartmentId || config.tenancy;
  }

  public static isReadOnlyMode(): boolean {
    return process.env.OCI_MCP_READ_ONLY === 'true' || process.env.OCI_MCP_READ_ONLY === '1';
  }
}
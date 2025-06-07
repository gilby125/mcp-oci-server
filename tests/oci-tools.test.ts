import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('OCI MCP Server Integration Tests', () => {
  beforeAll(async () => {
    // Build the project before running tests
    await execAsync('npm run build');
  });

  const testTool = async (toolName: string, args: any = {}, timeout = 30000): Promise<any> => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    const { stdout } = await execAsync(
      `echo '${JSON.stringify(request)}' | OCI_MCP_READ_ONLY=true timeout ${timeout / 1000}s node dist/index-readonly.js`,
      { timeout }
    );

    return JSON.parse(stdout);
  };

  const listTools = async (): Promise<string[]> => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    const { stdout } = await execAsync(
      `echo '${JSON.stringify(request)}' | OCI_MCP_READ_ONLY=true timeout 10s node dist/index-readonly.js`
    );

    const response = JSON.parse(stdout);
    return response.result.tools.map((tool: any) => tool.name);
  };

  test('should list all available tools', async () => {
    const tools = await listTools();
    
    expect(tools).toContain('list_compartments');
    expect(tools).toContain('list_instances');
    expect(tools).toContain('list_vcns');
    expect(tools).toContain('list_availability_domains');
    expect(tools).toContain('terminate_instance');
    expect(tools.length).toBeGreaterThan(10);
  }, 15000);

  test('should list compartments', async () => {
    const response = await testTool('list_compartments');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].type).toBe('text');
    
    const content = JSON.parse(response.result.content[0].text);
    expect(Array.isArray(content.compartments)).toBe(true);
  }, 30000);

  test('should list compute instances', async () => {
    const response = await testTool('list_instances');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('instances');
    expect(content).toHaveProperty('count');
    expect(Array.isArray(content.instances)).toBe(true);
  }, 30000);

  test('should list VCNs', async () => {
    const response = await testTool('list_vcns');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('vcns');
    expect(content).toHaveProperty('count');
    expect(Array.isArray(content.vcns)).toBe(true);
  }, 30000);

  test('should list availability domains', async () => {
    const response = await testTool('list_availability_domains');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('availabilityDomains');
    expect(Array.isArray(content.availabilityDomains)).toBe(true);
  }, 30000);

  test('should block destructive operations in read-only mode', async () => {
    const response = await testTool('terminate_instance', { 
      instanceId: 'ocid1.instance.test.invalid' 
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('error');
    expect(content.error).toBe('PERMISSION_DENIED');
    expect(content.message).toContain('read-only mode');
  }, 30000);

  test('should list kubernetes clusters', async () => {
    const response = await testTool('list_clusters');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('clusters');
    expect(Array.isArray(content.clusters)).toBe(true);
  }, 30000);

  test('should list block volumes', async () => {
    const response = await testTool('list_volumes');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('volumes');
    expect(Array.isArray(content.volumes)).toBe(true);
  }, 30000);

  test('should handle invalid tool name', async () => {
    const response = await testTool('invalid_tool_name');
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    
    const content = JSON.parse(response.result.content[0].text);
    expect(content).toHaveProperty('error');
    expect(content.error).toBe('UNKNOWN_TOOL');
  }, 15000);
});
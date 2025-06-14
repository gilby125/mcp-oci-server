# OCI MCP Server

A Model Context Protocol (MCP) server for Oracle Cloud Infrastructure (OCI) that provides comprehensive cloud resource management capabilities through AI assistants.

## 🚀 Latest Updates

- **✅ Updated Dependencies**: OCI SDK v2.111.0, MCP SDK v1.12.1, latest TypeScript
- **✅ Multiple Authentication Methods**: Session tokens, config files, and environment variables
- **✅ Comprehensive Testing**: Real OCI integration tests with safety controls
- **✅ Enhanced Safety**: Read-only mode enforcement for all tests and operations

## Features

### Compute Operations
- List, get, launch, and terminate compute instances
- List available shapes, images, and availability domains
- Instance lifecycle management

### Networking Operations
- List Virtual Cloud Networks (VCNs)
- List subnets with VCN filtering
- Network resource discovery

### Storage Operations
- List block volumes
- Storage resource management

### Container Operations (OKE)
- Create, list, get, and delete Kubernetes clusters
- Node pool management (create, list, get, delete)
- Get kubeconfig for cluster access
- Full OCI Container Engine for Kubernetes support

### Resource Management
- List compartments
- Resource organization and discovery

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

## Authentication

The server supports multiple authentication methods with automatic fallback:

### Option 1: OCI CLI with Session Tokens (Recommended)
```bash
# Install and configure OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
oci setup config

# The server automatically detects and uses session tokens
```

### Option 2: OCI Config File
Create `~/.oci/config` file:

```ini
[DEFAULT]
user=ocid1.user.oc1..your-user-ocid
fingerprint=your-key-fingerprint
tenancy=ocid1.tenancy.oc1..your-tenancy-ocid
region=us-ashburn-1
key_file=~/.oci/oci_api_key.pem
compartment_id=ocid1.compartment.oc1..your-compartment-ocid
```

### Option 3: Environment Variables
```bash
export OCI_TENANCY=ocid1.tenancy.oc1..your-tenancy-ocid
export OCI_USER=ocid1.user.oc1..your-user-ocid
export OCI_FINGERPRINT=your-key-fingerprint
export OCI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
export OCI_REGION=us-ashburn-1
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-ocid
```

**Authentication Priority:** Session Tokens → Config File → Environment Variables

## Safety Modes

### Read-Only Mode (Recommended for Safety)
Enables only safe, non-destructive operations like listing and viewing resources.

**Enable read-only mode:**
```bash
export OCI_MCP_READ_ONLY=true
# or
export OCI_MCP_READ_ONLY=1
```

**Read-only operations include:**
- All list operations (instances, VCNs, volumes, etc.)
- Get details of specific resources
- View configurations and metadata

**Blocked operations in read-only mode:**
- `terminate_instance` - Instance termination
- `delete_cluster` - Cluster deletion  
- `delete_node_pool` - Node pool deletion
- Any other destructive operations

### Full Mode
Enables all operations including destructive ones. Use with caution.

```bash
export OCI_MCP_READ_ONLY=false
# or unset the variable
unset OCI_MCP_READ_ONLY
```

## Usage with MCP Clients

### Claude Desktop (Read-Only Mode - Recommended)
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "oci-readonly": {
      "command": "node",
      "args": ["/path/to/mcp-oci-server/dist/index-readonly.js"],
      "env": {
        "OCI_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

### Claude Desktop (Full Mode - Use with Caution)
```json
{
  "mcpServers": {
    "oci-full": {
      "command": "node", 
      "args": ["/path/to/mcp-oci-server/dist/index-readonly.js"],
      "env": {
        "OCI_MCP_READ_ONLY": "false"
      }
    }
  }
}
```

### Cursor IDE
Go to Settings → MCP → Add new global MCP server:

```json
{
  "mcpServers": {
    "oci": {
      "command": "node",
      "args": ["/path/to/mcp-oci-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### Compute Tools
- `list_instances` - List compute instances
- `get_instance` - Get instance details
- `launch_instance` - Launch new instance
- `terminate_instance` - Terminate instance
- `list_shapes` - List available shapes
- `list_images` - List available images
- `list_availability_domains` - List availability domains

### Networking Tools
- `list_vcns` - List Virtual Cloud Networks
- `list_subnets` - List subnets

### Storage Tools
- `list_volumes` - List block volumes

### Container Tools
- `list_clusters` - List Kubernetes clusters
- `get_cluster` - Get cluster details
- `create_cluster` - Create new cluster
- `delete_cluster` - Delete cluster
- `list_node_pools` - List node pools
- `get_node_pool` - Get node pool details
- `create_node_pool` - Create new node pool
- `delete_node_pool` - Delete node pool
- `get_kubeconfig` - Get cluster kubeconfig

### Resource Tools
- `list_compartments` - List compartments

## Example Usage

Once configured with an MCP client, you can use natural language to interact with OCI:

- "List all my compute instances"
- "Create a new Kubernetes cluster named 'prod-cluster' in VCN ocid1.vcn..."
- "Show me the details of instance ocid1.instance..."
- "Get the kubeconfig for my cluster"
- "Launch a new VM.Standard2.1 instance in availability domain AD-1"

## Testing

The project includes comprehensive real-world testing with actual OCI services:

### Integration Tests
```bash
npm test                # Run Jest integration tests against real OCI
./test-oci-real.sh      # Shell-based comprehensive testing
```

### Manual Testing
```bash
# List available tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
  OCI_MCP_READ_ONLY=true node dist/index-readonly.js

# Test a specific tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_instances", "arguments": {}}}' | \
  OCI_MCP_READ_ONLY=true node dist/index-readonly.js
```

**Safety**: All tests enforce read-only mode to prevent accidental resource modifications.

## Development

```bash
# Development mode
npm run dev

# Build
npm run build

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Technical Details

### Server Variants
- **`dist/index.js`** - Full server with all OCI operations
- **`dist/index-simple.js`** - Simplified server without container/Kubernetes operations  
- **`dist/index-readonly.js`** - Safety-focused server with read-only mode enforcement

### Dependencies
- **OCI SDK**: v2.111.0 (latest with container engine improvements)
- **MCP SDK**: v1.12.1 (latest Model Context Protocol)
- **TypeScript**: v5.7.2 (latest with improved ESM support)

## Requirements

- Node.js 18+
- Valid OCI credentials and configuration
- Appropriate OCI permissions for the resources you want to manage

## Security

- Never commit private keys or sensitive configuration to version control
- Use IAM policies to limit the permissions of the OCI user
- Regularly rotate API keys and access tokens
- Consider using instance principals when running on OCI compute instances
- **Always use read-only mode for testing and exploration**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build              # Standard TypeScript compilation
npm run build-readonly     # Build readonly server variant
npm run start              # Start full server
npm run start-readonly     # Start readonly server
npm run start-safe         # Start readonly with env var
npm run dev                # Development mode with tsx
npm test                   # Run Jest tests
./test-mcp-server.sh       # Integration testing
```

## Architecture Overview

This is an Oracle Cloud Infrastructure (OCI) MCP Server with three distinct server variants:

- **`src/index.ts`** - Full server with all OCI operations (destructive actions enabled)
- **`src/index-simple.ts`** - Simplified server without container/Kubernetes operations
- **`src/index-readonly.ts`** - Safety-focused server with read-only mode enforcement

## Key Services

### Configuration Service (`src/services/oci-config.ts`)
Handles OCI authentication with automatic fallback:
1. OCI config file (`~/.oci/config`)
2. Standard environment variables (`OCI_TENANCY`, `OCI_USER`, etc.)
3. OCI CLI environment variables (`OCI_CLI_TENANCY`, `OCI_CLI_USER`, etc.)

### Client Services
- **`oci-client.ts`** - Full OCI client with all services
- **`oci-client-simple.ts`** - Simplified client without container engine

## Tool Organization

Tools are categorized by OCI service area in `src/tools/`:
- **Compute**: Instance management (with readonly variants)
- **Networking**: VCN, subnets, security rules
- **Storage**: Block volumes, file systems
- **Container**: Kubernetes/OKE operations
- **Resource**: Compartments and identity

## Safety Pattern

The codebase implements a read-only safety mode:
- Set `OCI_MCP_READ_ONLY=true` to block destructive operations
- Each tool category has readonly variants that filter destructive operations
- Runtime safety checks prevent destructive operations in readonly mode
- Returns structured error responses for blocked operations

## Development Patterns

### Tool Definition
```typescript
export const toolName: Tool = {
  name: 'tool_name',
  description: 'Description',
  inputSchema: { /* JSON Schema */ }
};
```

### Handler Pattern
```typescript
export async function handleToolCategory(
  toolName: string,
  args: any,
  ociClient: OCIClientService
): Promise<any>
```

### Safety Check Pattern
```typescript
const isReadOnly = OCIConfigService.isReadOnlyMode();
if (isReadOnly && isDestructiveOperation) {
  return { error: 'PERMISSION_DENIED', message: '...' };
}
```

## Testing

The project includes comprehensive real-world testing with actual OCI services:

### Integration Tests (Jest)
```bash
npm test                # Run all integration tests against real OCI
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

**Prerequisites**: Valid OCI configuration (either `~/.oci/config` or environment variables)

Integration tests cover:
- **All OCI tools**: Tests every tool with real OCI API calls
- **Read-only mode enforcement**: Verifies destructive operations are blocked
- **Error handling**: Tests invalid parameters and error responses
- **Tool discovery**: Validates all tools are properly registered

### Shell-based Integration Testing
```bash
./test-oci-real.sh      # Comprehensive real OCI testing script
```

This script tests:
1. **Tool listing**: Verifies all tools are available
2. **Safe operations**: Lists compartments, instances, VCNs, etc.
3. **Read-only enforcement**: Attempts destructive operations (should fail)
4. **Error handling**: Tests with invalid parameters

### Manual Testing

**List all available tools**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
  node dist/index-readonly.js | jq '.result.tools[].name'
```

**Test a specific tool**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_instances", "arguments": {}}}' | \
  node dist/index-readonly.js | jq '.result'
```

**Test read-only mode**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "terminate_instance", "arguments": {"instanceId": "test"}}}' | \
  OCI_MCP_READ_ONLY=true node dist/index-readonly.js
```

### Test Requirements
- Valid OCI credentials and configuration
- Network access to OCI APIs
- Appropriate IAM permissions for tested operations
- At least one compartment accessible to the configured user

**Safety**: All tests enforce read-only mode (`OCI_MCP_READ_ONLY=true`) to prevent accidental resource modifications. Destructive operations are tested to ensure they are properly blocked.

## OCI SDK Update Notes (v2.111.0)

**Breaking Changes Addressed:**
- Container Engine cluster and node pool time metadata moved to `metadata.timeCreated` and `metadata.timeUpdated`
- Create operations now return work request IDs instead of the created objects
- Kubeconfig response property changed from `inputStream` to `value`
- Node pool summary/detail objects no longer include `timeCreated` directly

**Migration Impact:**
- Create cluster/node pool operations temporarily throw errors indicating work request handling needed
- Time tracking for clusters now uses `cluster.metadata?.timeCreated` instead of `cluster.timeCreated`
- Kubeconfig stream handling updated to support both ReadableStream and Node.js Readable streams

## MCP Client Configuration

The server supports three deployment modes via different entry points:
- **Full mode**: `dist/index.js` - All operations enabled
- **Simple mode**: `dist/index-simple.js` - No container/Kubernetes operations
- **Read-only mode**: `dist/index-readonly.js` - Safety-focused with OCI_MCP_READ_ONLY enforcement

Example Claude Desktop config for read-only mode:
```json
{
  "mcpServers": {
    "oci-readonly": {
      "command": "node",
      "args": ["/path/to/dist/index-readonly.js"],
      "env": { "OCI_MCP_READ_ONLY": "true" }
    }
  }
}
```
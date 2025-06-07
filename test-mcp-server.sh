#!/bin/bash

echo "🧪 OCI MCP Server Test Script"
echo "============================="

# Test 1: List available tools
echo -e "\n📋 Test 1: Listing available tools"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
  OCI_TENANCY=test OCI_USER=test OCI_FINGERPRINT=test OCI_PRIVATE_KEY=test OCI_REGION=us-ashburn-1 \
  OCI_MCP_READ_ONLY=true \
  node dist/index-readonly.js 2>/dev/null | jq -r '.result.tools[].name' | head -10

# Test 2: Test read-only mode blocking
echo -e "\n🔒 Test 2: Testing read-only mode (should block terminate)"
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "terminate_instance", "arguments": {"instanceId": "ocid1.instance.test"}}}' | \
  OCI_TENANCY=test OCI_USER=test OCI_FINGERPRINT=test OCI_PRIVATE_KEY=test OCI_REGION=us-ashburn-1 \
  OCI_MCP_READ_ONLY=true \
  node dist/index-readonly.js 2>/dev/null | jq '.result.content[0].text' | jq -r '.'

# Test 3: Test full mode
echo -e "\n🔓 Test 3: Testing full mode (would allow terminate if real OCI)"
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/list"}' | \
  OCI_TENANCY=test OCI_USER=test OCI_FINGERPRINT=test OCI_PRIVATE_KEY=test OCI_REGION=us-ashburn-1 \
  OCI_MCP_READ_ONLY=false \
  node dist/index-readonly.js 2>/dev/null | jq -r '.result.tools[].name' | grep terminate

echo -e "\n✅ Tests completed!"
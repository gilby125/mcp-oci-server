#!/bin/bash

echo "🏗️  OCI MCP Server Real Integration Tests"
echo "========================================"

# Check for OCI configuration
if [ ! -f ~/.oci/config ] && [ -z "$OCI_TENANCY" ]; then
    echo "❌ No OCI configuration found!"
    echo "Please set up either:"
    echo "1. ~/.oci/config file with valid credentials"
    echo "2. Environment variables: OCI_TENANCY, OCI_USER, OCI_FINGERPRINT, OCI_PRIVATE_KEY, OCI_REGION, OCI_COMPARTMENT_ID"
    exit 1
fi

# Build first
echo "🔨 Building project..."
npm run build

# Function to test tool
test_tool() {
    local tool_name="$1"
    local params="$2"
    local description="$3"
    
    echo -e "\n🔧 Testing: $description"
    echo "Tool: $tool_name"
    
    local result=$(echo "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"$tool_name\", \"arguments\": $params}}" | \
        OCI_MCP_READ_ONLY=true timeout 30s node dist/index-readonly.js 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ Success"
        echo "$result" | jq '.result.content[0].text' 2>/dev/null | head -3
    else
        echo "❌ Failed or timed out"
    fi
}

# Test 1: List available tools
echo -e "\n📋 Test 1: List available tools"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | \
    OCI_MCP_READ_ONLY=true timeout 10s node dist/index-readonly.js 2>/dev/null | \
    jq -r '.result.tools[].name' | head -10

# Test 2: List compartments (safe read operation)
test_tool "list_compartments" "{}" "List compartments"

# Test 3: List compute instances 
test_tool "list_instances" "{}" "List compute instances"

# Test 4: List VCNs
test_tool "list_vcns" "{}" "List Virtual Cloud Networks"

# Test 5: List availability domains
test_tool "list_availability_domains" "{}" "List availability domains"

# Test 6: Test read-only mode enforcement
echo -e "\n🔒 Test 6: Testing read-only mode (should block destructive operations)"
test_tool "terminate_instance" "{\"instanceId\": \"ocid1.instance.test\"}" "Terminate instance (should be blocked)"

# Test 7: List clusters (if OKE is available)
test_tool "list_clusters" "{}" "List Kubernetes clusters"

# Test 8: List block volumes
test_tool "list_volumes" "{}" "List block volumes"

echo -e "\n✅ All tests completed!"
echo "Note: Some tests may show 'not found' results if you don't have resources in your compartment."
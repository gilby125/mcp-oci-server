#!/bin/bash
# OCI Environment Variables Setup Template
# Copy this file and fill in your actual values

export OCI_TENANCY="ocid1.tenancy.oc1..your-tenancy-ocid"
export OCI_USER="ocid1.user.oc1..your-user-ocid" 
export OCI_FINGERPRINT="your-key-fingerprint"
export OCI_REGION="us-ashburn-1"
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your-compartment-ocid"

# Option 1: Point to key file
export OCI_KEY_FILE="~/.oci/oci_api_key.pem"

# Option 2: Or embed key content directly (not recommended for security)
# export OCI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
# your-private-key-content-here
# -----END PRIVATE KEY-----"

echo "OCI environment variables set!"
echo "To use: source setup-oci-env.sh"
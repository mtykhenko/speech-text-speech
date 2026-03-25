#!/bin/bash
set -e

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create config directory if it doesn't exist
mkdir -p config

# Generate S3 config file with credentials from environment
cat > config/s3.json <<EOF
{
  "identities": [
    {
      "name": "default",
      "credentials": [
        {
          "accessKey": "${S3_ACCESS_KEY}",
          "secretKey": "${S3_SECRET_KEY}"
        }
      ],
      "actions": [
        "Admin",
        "Read",
        "Write"
      ]
    }
  ]
}
EOF

echo "✓ Generated config/s3.json with credentials from .env"

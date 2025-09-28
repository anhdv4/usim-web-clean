#!/bin/bash
# 🔧 PayOS Setup Script for Linux/Mac/Windows (Git Bash)
# Helps configure PayOS integration for the USIM web application

echo "=========================================="
echo "🔧 PayOS Setup Script"
echo "=========================================="
echo ""

read -p "Enter PayOS Client ID: " CLIENT_ID
read -p "Enter PayOS API Key: " API_KEY
read -p "Enter PayOS Checksum Key: " CHECKSUM_KEY
read -p "Enter environment (sandbox/prod) [prod]: " ENVIRONMENT

if [ -z "$ENVIRONMENT" ]; then
    ENVIRONMENT="prod"
fi

echo ""
echo "[INFO] Creating .env.local file..."

# Create .env.local file
cat > .env.local << EOF
# PayOS Configuration
PAYOS_CLIENT_ID=$CLIENT_ID
PAYOS_API_KEY=$API_KEY
PAYOS_CHECKSUM_KEY=$CHECKSUM_KEY

# PayOS Webhook URL
EOF

if [ "$ENVIRONMENT" = "prod" ]; then
    cat >> .env.local << EOF
PAYOS_WEBHOOK_URL=https://daily.telebox.vn/api/webhook/payos
NEXT_PUBLIC_BASE_URL=https://daily.telebox.vn
EOF
else
    cat >> .env.local << EOF
PAYOS_WEBHOOK_URL=https://your-staging-domain.com/api/webhook/payos
NEXT_PUBLIC_BASE_URL=https://your-staging-domain.com
EOF
fi

cat >> .env.local << EOF

# PayOS Environment
PAYOS_ENV=$ENVIRONMENT
EOF

echo "[SUCCESS] .env.local file created successfully!"
echo ""
echo "[INFO] PayOS configuration summary:"
echo "=========================================="
echo "Client ID: $CLIENT_ID"
echo "API Key: $API_KEY"
echo "Checksum Key: $CHECKSUM_KEY"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""
echo "[INFO] Next steps:"
echo "1. Test the configuration: npm run dev"
echo "2. Test PayOS integration: curl http://localhost:3000/api/test-payos"
echo "3. For production, update webhook URL in PayOS dashboard"
echo "4. Deploy using: deploy.bat prod (on Windows) or manual deploy"
echo ""
echo "[WARNING] Keep your PayOS credentials secure and never commit to git!"
echo ""
#!/bin/bash

# Setup EAS secrets for production
echo "Setting up EAS secrets for production..."

# Set production API URL (replace with your actual production URL)
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-production-api.com/api/v1" --type string

echo "EAS secrets configured successfully!"
echo "Remember to update the production API URL with your actual endpoint."
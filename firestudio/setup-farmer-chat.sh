#!/bin/bash

# Farmer Community Chat - Database Setup Script
# This script sets up the enhanced farmer community chat database

echo "🌾 Setting up Farmer Community Chat Database..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}📝 Running database migration...${NC}"

# Apply the enhanced schema
supabase db reset --debug

echo -e "${BLUE}🗃️ Applying enhanced farmer community schema...${NC}"

# Run the enhanced schema
supabase db push --include-all

echo -e "${BLUE}🔧 Setting up storage buckets...${NC}"

# Create storage bucket via SQL
supabase sql --file FARMER_COMMUNITY_ENHANCED_SCHEMA.sql

echo -e "${GREEN}✅ Database setup complete!${NC}"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your .env.local with Supabase credentials"
echo "2. Start your development server: npm run dev"
echo "3. Navigate to /farmer-community-enhanced to test the chat"

echo -e "${GREEN}🎉 Farmer Community Chat is ready!${NC}"

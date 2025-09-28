#!/bin/bash

# ============================================================================
# FIRE STUDIO DATABASE SETUP SCRIPT
# Run this to execute all SQL files in correct order
# ============================================================================

echo "🔄 Fire Studio Database Setup Starting..."

# Check if SQL files exist
SQL_DIR="./sql"
if [ ! -d "$SQL_DIR" ]; then
    echo "❌ SQL directory not found. Make sure you're in the project root."
    exit 1
fi

echo "📋 SQL files to execute:"
ls -la $SQL_DIR/*.sql

echo ""
echo "⚠️  IMPORTANT: Run these SQL files manually in Supabase SQL Editor in this exact order:"
echo ""
echo "1️⃣  01_backup_data.sql (OPTIONAL - for backup)"
echo "2️⃣  02_reset_database.sql (DESTRUCTIVE - deletes all data)"
echo "3️⃣  03_create_market_prices.sql"
echo "4️⃣  04_create_welfare_schemes.sql" 
echo "5️⃣  05_create_user_auth.sql"
echo "6️⃣  06_create_crops.sql"
echo "7️⃣  07_seed_sample_data.sql"
echo ""
echo "🌐 Access your Supabase project:"
echo "   URL: https://supabase.com/dashboard/project/hreptuxylrsqhqnpfwez"
echo "   Go to: SQL Editor → New query → Copy & paste each file"
echo ""
echo "⚡ After running all SQL files, test the setup with:"
echo "   npm run test:db"
echo ""
echo "🎯 Your database will have:"
echo "   ✅ Market Prices (real-time commodity prices)"
echo "   ✅ Welfare Schemes (government benefits)"
echo "   ✅ User Authentication (OTP-based)"
echo "   ✅ Crop Management (farmer tracking)"
echo "   ✅ Row Level Security (RLS enabled)"
echo "   ✅ Performance indexes & materialized views"
echo ""

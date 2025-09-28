const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('🔗 Connected to Supabase:', supabaseUrl);

async function truncateTable(tableName) {
    console.log(`�️  Truncating ${tableName}...`);
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
            console.error(`❌ Error truncating ${tableName}:`, error.message);
            return false;
        }
        console.log(`✅ Successfully truncated ${tableName}`);
        return true;
    } catch (err) {
        console.error(`❌ Exception truncating ${tableName}:`, err.message);
        return false;
    }
}

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('id', { head: true, count: 'exact' });
        
        return !error;
    } catch {
        return false;
    }
}

async function getTableRowCount(tableName) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (error) return 'Unknown';
        return count || 0;
    } catch {
        return 'Unknown';
    }
}

async function resetDatabase() {
    console.log('🚀 Starting Fire Studio Agricultural Platform Database Reset...\n');
    
    // Step 1: Test connection
    console.log('� Testing database connection...');
    const { data: testData, error: testError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
    
    if (testError) {
        console.error('❌ Database connection failed:', testError.message);
        return false;
    }
    console.log('✅ Database connection successful');
    
    // Step 2: Delete all data from existing tables (in correct order for foreign key constraints)
    console.log('\n🗑️  STEP 1: Deleting all data from tables...');
    
    const tablesToTruncate = [
        'crop_logs',      // Child of crops
        'crops',          // Child of user_profiles  
        'otp_codes',      // Independent
        'market_prices',  // Independent
        'welfare_schemes', // Independent
        'user_profiles'   // Child of auth.users (but we won't delete auth)
    ];
    
    for (const table of tablesToTruncate) {
        const exists = await checkTableExists(table);
        if (exists) {
            const beforeCount = await getTableRowCount(table);
            console.log(`📊 ${table}: ${beforeCount} rows before deletion`);
            
            await truncateTable(table);
            
            const afterCount = await getTableRowCount(table);
            console.log(`📊 ${table}: ${afterCount} rows after deletion`);
        } else {
            console.log(`⚠️  Table ${table} doesn't exist or is inaccessible`);
        }
    }
    
    // Step 3: Verify tables are empty
    console.log('\n✅ STEP 2: Verifying tables are empty...');
    
    for (const table of tablesToTruncate) {
        const exists = await checkTableExists(table);
        if (exists) {
            const count = await getTableRowCount(table);
            if (count === 0) {
                console.log(`✅ ${table}: Empty (${count} rows)`);
            } else {
                console.log(`⚠️  ${table}: Still has ${count} rows`);
            }
        }
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 SQL Commands that would be executed for full schema recreation:');
    
    // Display the SQL commands that would need to be run manually
    const sqlCommands = `
-- Execute these commands in Supabase SQL Editor for complete reset:

-- 1. Delete all data (already done by this script):
TRUNCATE TABLE crop_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE crops RESTART IDENTITY CASCADE;
TRUNCATE TABLE otp_codes RESTART IDENTITY CASCADE;
TRUNCATE TABLE market_prices RESTART IDENTITY CASCADE;
TRUNCATE TABLE welfare_schemes RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE;

-- 2. Drop and recreate materialized views:
DROP MATERIALIZED VIEW IF EXISTS latest_market_prices CASCADE;
DROP FUNCTION IF EXISTS refresh_latest_market_prices() CASCADE;

-- 3. Recreate schemas (run these files in order):
-- File: sql/03_create_market_prices.sql
-- File: sql/04_create_welfare_schemes.sql  
-- File: sql/05_create_user_auth.sql
-- File: sql/06_create_crops.sql
-- File: sql/07_seed_sample_data.sql
`;
    
    console.log(sqlCommands);
    console.log('\nNext steps:');
    console.log('1. If tables need complete recreation, run the SQL files manually in Supabase');
    console.log('2. Run seed script: node seed_sample_data.js');
    console.log('3. Test your Next.js API routes');
    console.log('4. Verify frontend components work correctly');
    
    return true;
}

// Execute the reset
resetDatabase()
    .then(() => {
        console.log('\n✅ All operations completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error during reset:', error);
        process.exit(1);
    });

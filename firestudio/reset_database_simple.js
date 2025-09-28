const { createClient } = require('@supabase/supabase-js');

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

async function deleteAllFromTable(tableName) {
    console.log(`\n🗑️  Deleting all data from ${tableName}...`);
    
    try {
        // First, try to get count before deletion
        const { count: beforeCount, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.log(`⚠️  Table ${tableName} might not exist or is not accessible: ${countError.message}`);
            return false;
        }
        
        console.log(`📊 ${tableName}: ${beforeCount} rows found`);
        
        if (beforeCount === 0) {
            console.log(`✅ ${tableName}: Already empty`);
            return true;
        }
        
        // Delete all data
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition matches all records
        
        if (deleteError) {
            console.error(`❌ Error deleting from ${tableName}:`, deleteError.message);
            return false;
        }
        
        // Verify deletion
        const { count: afterCount, error: verifyError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (!verifyError) {
            console.log(`✅ ${tableName}: Successfully deleted ${beforeCount - afterCount} rows (${afterCount} remaining)`);
        } else {
            console.log(`✅ ${tableName}: Deletion completed (verification failed: ${verifyError.message})`);
        }
        
        return true;
    } catch (err) {
        console.error(`❌ Exception with ${tableName}:`, err.message);
        return false;
    }
}

async function resetDatabase() {
    console.log('🚀 Starting Fire Studio Agricultural Platform Database Reset...\n');
    
    // Tables to reset in order (children first, then parents)
    const tablesToReset = [
        'crop_logs',      // Child of crops
        'crops',          // Child of user_profiles
        'otp_codes',      // Independent
        'market_prices',  // Independent
        'welfare_schemes', // Independent
        'user_profiles'   // Child of auth.users (we won't delete auth.users)
    ];
    
    let successCount = 0;
    let totalTables = tablesToReset.length;
    
    for (const table of tablesToReset) {
        const success = await deleteAllFromTable(table);
        if (success) successCount++;
    }
    
    console.log(`\n📊 Reset Summary:`);
    console.log(`✅ Successfully processed: ${successCount}/${totalTables} tables`);
    
    if (successCount === totalTables) {
        console.log('\n🎉 Database reset completed successfully!');
    } else {
        console.log('\n⚠️  Some tables had issues. Check the logs above.');
    }
    
    console.log('\n📋 Manual SQL Commands for Complete Reset:');
    console.log('If you want to reset the schema completely, run this in Supabase SQL Editor:');
    
    const manualSQL = `
-- Complete reset SQL (run in Supabase SQL Editor):

-- 1. Delete all data
TRUNCATE TABLE crop_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE crops RESTART IDENTITY CASCADE;
TRUNCATE TABLE otp_codes RESTART IDENTITY CASCADE; 
TRUNCATE TABLE market_prices RESTART IDENTITY CASCADE;
TRUNCATE TABLE welfare_schemes RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_profiles RESTART IDENTITY CASCADE;

-- 2. Drop materialized views and functions
DROP MATERIALIZED VIEW IF EXISTS latest_market_prices CASCADE;
DROP FUNCTION IF EXISTS refresh_latest_market_prices() CASCADE;
DROP FUNCTION IF EXISTS update_market_prices_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_crops_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_welfare_schemes_updated_at() CASCADE;

-- 3. Verify tables are empty
SELECT 'market_prices' as table_name, count(*) as row_count FROM market_prices
UNION ALL
SELECT 'welfare_schemes', count(*) FROM welfare_schemes
UNION ALL  
SELECT 'user_profiles', count(*) FROM user_profiles
UNION ALL
SELECT 'crops', count(*) FROM crops
UNION ALL
SELECT 'crop_logs', count(*) FROM crop_logs
UNION ALL
SELECT 'otp_codes', count(*) FROM otp_codes;
`;
    
    console.log(manualSQL);
    
    console.log('\nNext Steps:');
    console.log('1. To recreate schema completely: Run SQL files in order:');
    console.log('   - sql/03_create_market_prices.sql');
    console.log('   - sql/04_create_welfare_schemes.sql');
    console.log('   - sql/05_create_user_auth.sql');
    console.log('   - sql/06_create_crops.sql');
    console.log('   - sql/07_seed_sample_data.sql');
    console.log('2. Test your API routes at http://localhost:9005');
    console.log('3. Check that all frontend components work correctly');
    
    return true;
}

// Execute the reset
resetDatabase()
    .then(() => {
        console.log('\n✅ Database reset process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error during reset:', error);
        process.exit(1);
    });

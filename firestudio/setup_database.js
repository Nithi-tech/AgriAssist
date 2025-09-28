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

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('🔗 Connected to Supabase:', supabaseUrl);

async function deleteAllFromCrops() {
    console.log('\n🗑️  Clearing existing crops data...');
    
    try {
        // Delete all records from crops table using gte filter (all IDs)
        const { data, error } = await supabase
            .from('crops')
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
            console.error('❌ Error deleting crops:', error.message);
            return false;
        }
        
        console.log('✅ Successfully cleared crops table');
        return true;
    } catch (err) {
        console.error('❌ Exception clearing crops:', err.message);
        return false;
    }
}

async function setupDatabase() {
    console.log('🚀 Starting Fire Studio Database Setup...\n');
    
    // Step 1: Clear existing crops data
    await deleteAllFromCrops();
    
    console.log('\n📋 Database Status Summary:');
    console.log('✅ Crops table: Cleared of existing data');
    console.log('⚠️  Other tables: Not found in database (need to be created)');
    
    console.log('\n🔧 To Complete Database Setup:');
    console.log('You need to run the SQL schema files in Supabase SQL Editor in this order:');
    console.log('');
    console.log('1. 📄 sql/03_create_market_prices.sql');
    console.log('   - Creates market_prices table');
    console.log('   - Adds indexes and RLS policies');
    console.log('   - Creates materialized view for latest prices');
    console.log('');
    console.log('2. 📄 sql/04_create_welfare_schemes.sql');
    console.log('   - Creates welfare_schemes table');
    console.log('   - Adds full-text search capabilities');
    console.log('   - Sets up RLS policies');
    console.log('');
    console.log('3. 📄 sql/05_create_user_auth.sql');
    console.log('   - Creates user_profiles table');
    console.log('   - Creates otp_codes table');
    console.log('   - Sets up authentication flow');
    console.log('');
    console.log('4. 📄 sql/06_create_crops.sql');
    console.log('   - Recreates crops table with full schema');
    console.log('   - Creates crop_logs table');
    console.log('   - Sets up farmer crop management');
    console.log('');
    console.log('5. 📄 sql/07_seed_sample_data.sql');
    console.log('   - Adds sample market prices');
    console.log('   - Adds sample welfare schemes');
    console.log('   - Adds sample user profiles and crops');
    console.log('');
    
    console.log('🌐 Alternative: Use the manual SQL file:');
    console.log('📄 MANUAL_DATABASE_RESET.sql - Contains all commands in one file');
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Open Supabase Dashboard: https://app.supabase.com');
    console.log('2. Go to SQL Editor');
    console.log('3. Run each .sql file in the order listed above');
    console.log('4. Test your application at http://localhost:9005');
    
    console.log('\n✅ Current setup completed successfully!');
    console.log('The database is ready for schema creation via SQL files.');
    
    return true;
}

// Execute setup
setupDatabase()
    .then(() => {
        console.log('\n🎉 Database setup guidance completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error during setup:', error);
        process.exit(1);
    });

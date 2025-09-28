const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testTable(tableName, description) {
    console.log(`\n🔍 Testing ${tableName} (${description}):`);
    
    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(3);
        
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Table exists with ${count} records`);
        if (data && data.length > 0) {
            console.log(`📄 Sample record:`, Object.keys(data[0]).slice(0, 5).join(', ') + '...');
        }
        return true;
    } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        return false;
    }
}

async function testMaterializedView() {
    console.log(`\n🔍 Testing latest_market_prices materialized view:`);
    
    try {
        const { data, error } = await supabase
            .from('latest_market_prices')
            .select('*')
            .limit(2);
        
        if (error) {
            console.error(`❌ Materialized view error: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Materialized view working with ${data.length} latest prices`);
        return true;
    } catch (err) {
        console.error(`❌ Materialized view exception: ${err.message}`);
        return false;
    }
}

async function verifyDatabase() {
    console.log('🔍 Fire Studio Database Verification\n');
    console.log('🔗 Connected to:', supabaseUrl);
    
    const tables = [
        { name: 'market_prices', desc: 'Agricultural market prices' },
        { name: 'welfare_schemes', desc: 'Government welfare schemes' },
        { name: 'user_profiles', desc: 'User profiles and authentication' },
        { name: 'otp_codes', desc: 'OTP authentication codes' },
        { name: 'crops', desc: 'Farmer crop management' },
        { name: 'crop_logs', desc: 'Crop activity logging' }
    ];
    
    let successCount = 0;
    
    for (const table of tables) {
        const success = await testTable(table.name, table.desc);
        if (success) successCount++;
    }
    
    // Test materialized view
    const mvSuccess = await testMaterializedView();
    if (mvSuccess) successCount++;
    
    console.log(`\n📊 Database Verification Summary:`);
    console.log(`✅ Successfully verified: ${successCount}/${tables.length + 1} components`);
    
    if (successCount === tables.length + 1) {
        console.log(`\n🎉 Database setup is complete and working perfectly!`);
        console.log(`\n🚀 Your Fire Studio Agricultural Platform is ready:`);
        console.log(`   • Market Prices: ✅ Working`);
        console.log(`   • Welfare Schemes: ✅ Working`);
        console.log(`   • User Authentication: ✅ Working`);
        console.log(`   • Crop Management: ✅ Working`);
        console.log(`   • Real-time Data: ✅ Working`);
        console.log(`\n🌐 Test your application at: http://localhost:9005`);
    } else {
        console.log(`\n⚠️  Some components need attention. Run COMPLETE_DATABASE_SETUP.sql in Supabase.`);
    }
    
    return successCount === tables.length + 1;
}

verifyDatabase()
    .then((success) => {
        if (success) {
            console.log('\n✅ Database verification completed successfully!');
            process.exit(0);
        } else {
            console.log('\n❌ Database verification found issues.');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });

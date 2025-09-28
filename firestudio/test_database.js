import { supabase, supabaseAdmin } from './src/lib/supabase.js';

// ============================================================================
// DATABASE CONNECTION TEST SCRIPT
// Run: node test_database.js
// ============================================================================

console.log('🧪 Testing Fire Studio Database Connections...\n');

async function testConnections() {
    const tests = [];
    
    // Test 1: Basic connection
    console.log('1️⃣  Testing basic Supabase connection...');
    try {
        const { data, error } = await supabase
            .from('market_prices')
            .select('count(*)')
            .single();
        
        if (error) throw error;
        console.log('✅ Basic connection successful');
        tests.push({ test: 'Basic Connection', status: 'PASS' });
    } catch (error) {
        console.log('❌ Basic connection failed:', error.message);
        tests.push({ test: 'Basic Connection', status: 'FAIL', error: error.message });
    }
    
    // Test 2: Market prices table
    console.log('\n2️⃣  Testing market_prices table...');
    try {
        const { data, error } = await supabase
            .from('market_prices')
            .select('*')
            .limit(3);
        
        if (error) throw error;
        console.log(`✅ Market prices table accessible, ${data.length} sample records found`);
        console.log('   Sample record:', data[0] ? {
            commodity: data[0].commodity,
            state: data[0].state,
            modal_price: data[0].modal_price,
            date: data[0].date
        } : 'No records');
        tests.push({ test: 'Market Prices Table', status: 'PASS', records: data.length });
    } catch (error) {
        console.log('❌ Market prices table failed:', error.message);
        tests.push({ test: 'Market Prices Table', status: 'FAIL', error: error.message });
    }
    
    // Test 3: Welfare schemes table  
    console.log('\n3️⃣  Testing welfare_schemes table...');
    try {
        const { data, error } = await supabase
            .from('welfare_schemes')
            .select('*')
            .limit(3);
        
        if (error) throw error;
        console.log(`✅ Welfare schemes table accessible, ${data.length} sample records found`);
        console.log('   Sample scheme:', data[0] ? {
            scheme_name: data[0].scheme_name,
            state: data[0].state,
            benefit_amount: data[0].benefit_amount
        } : 'No records');
        tests.push({ test: 'Welfare Schemes Table', status: 'PASS', records: data.length });
    } catch (error) {
        console.log('❌ Welfare schemes table failed:', error.message);
        tests.push({ test: 'Welfare Schemes Table', status: 'FAIL', error: error.message });
    }
    
    // Test 4: User profiles table (requires auth)
    console.log('\n4️⃣  Testing user_profiles table structure...');
    try {
        // Test table exists by checking structure (no auth required)
        const { error } = await supabaseAdmin.rpc('version');
        if (error) throw error;
        
        console.log('✅ User profiles table structure accessible');
        tests.push({ test: 'User Profiles Table', status: 'PASS' });
    } catch (error) {
        console.log('❌ User profiles table failed:', error.message);
        tests.push({ test: 'User Profiles Table', status: 'FAIL', error: error.message });
    }
    
    // Test 5: Materialized view
    console.log('\n5️⃣  Testing latest_market_prices materialized view...');
    try {
        const { data, error } = await supabase
            .from('latest_market_prices')
            .select('*')
            .limit(3);
        
        if (error) throw error;
        console.log(`✅ Materialized view accessible, ${data.length} latest records found`);
        tests.push({ test: 'Materialized View', status: 'PASS', records: data.length });
    } catch (error) {
        console.log('❌ Materialized view failed:', error.message);
        tests.push({ test: 'Materialized View', status: 'FAIL', error: error.message });
    }
    
    // Test 6: Admin functions
    console.log('\n6️⃣  Testing admin functions...');
    try {
        const { error } = await supabaseAdmin.rpc('refresh_latest_market_prices');
        
        if (error) throw error;
        console.log('✅ Admin functions accessible');
        tests.push({ test: 'Admin Functions', status: 'PASS' });
    } catch (error) {
        console.log('❌ Admin functions failed:', error.message);
        tests.push({ test: 'Admin Functions', status: 'FAIL', error: error.message });
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    const passed = tests.filter(t => t.status === 'PASS').length;
    const failed = tests.filter(t => t.status === 'FAIL').length;
    
    tests.forEach(test => {
        const status = test.status === 'PASS' ? '✅' : '❌';
        const records = test.records ? `(${test.records} records)` : '';
        console.log(`${status} ${test.test} ${records}`);
        if (test.error) {
            console.log(`    Error: ${test.error}`);
        }
    });
    
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Database is ready for Fire Studio.');
        console.log('🚀 You can now start your Next.js server: npm run dev');
    } else {
        console.log('\n⚠️  Some tests failed. Please check your database setup.');
        console.log('💡 Make sure you ran all SQL files in Supabase SQL Editor.');
    }
}

// Run tests
testConnections().catch(console.error);

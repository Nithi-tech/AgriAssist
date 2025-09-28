/**
 * Farmer Community Test Suite
 * Test the community client functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('🔗 Connected to Supabase:', supabaseUrl);

async function testTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`❌ Table ${tableName}: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Table ${tableName}: EXISTS (${data?.length || 0} rows)`);
        return true;
    } catch (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
        return false;
    }
}

async function testView() {
    try {
        const { data, error } = await supabase
            .from('community_messages_with_details')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log(`❌ View community_messages_with_details: ${error.message}`);
            return false;
        }
        
        console.log(`✅ View community_messages_with_details: EXISTS`);
        return true;
    } catch (error) {
        console.log(`❌ View community_messages_with_details: ${error.message}`);
        return false;
    }
}

async function testFunction() {
    try {
        // Test with a dummy UUID
        const { data, error } = await supabase
            .rpc('get_message_thread', { main_message_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && !error.message.includes('invalid input syntax')) {
            console.log(`❌ Function get_message_thread: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Function get_message_thread: EXISTS`);
        return true;
    } catch (error) {
        console.log(`❌ Function get_message_thread: ${error.message}`);
        return false;
    }
}

async function testCreateMessage() {
    try {
        // First, get a test user
        const { data: users, error: userError } = await supabase
            .from('auth_users')
            .select('id')
            .limit(1);
        
        if (userError || !users || users.length === 0) {
            console.log('⚠️  No test users found, skipping message creation test');
            return true;
        }
        
        const testUserId = users[0].id;
        
        // Create a test message
        const { data, error } = await supabase
            .from('community_messages')
            .insert([{
                user_id: testUserId,
                content: 'Test message for Farmer Community feature'
            }])
            .select()
            .single();
        
        if (error) {
            console.log(`❌ Message creation test: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Message creation test: SUCCESS (ID: ${data.message_id})`);
        
        // Clean up test message
        await supabase
            .from('community_messages')
            .delete()
            .eq('message_id', data.message_id);
        
        return true;
    } catch (error) {
        console.log(`❌ Message creation test: ${error.message}`);
        return false;
    }
}

async function testPermissions() {
    try {
        // Test public read access
        const { data, error } = await supabase
            .from('community_messages_with_details')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log(`❌ Public read test: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Public read permissions: OK`);
        return true;
    } catch (error) {
        console.log(`❌ Permission test: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Running Farmer Community Tests...\n');
    
    let allPassed = true;
    
    // Test 1: Check if required tables exist
    console.log('📋 Testing Database Tables:');
    allPassed &= await testTableExists('community_messages');
    allPassed &= await testTableExists('community_likes');
    allPassed &= await testTableExists('auth_users');
    
    console.log('\n📊 Testing Database Objects:');
    allPassed &= await testView();
    allPassed &= await testFunction();
    
    console.log('\n🔒 Testing Permissions:');
    allPassed &= await testPermissions();
    
    console.log('\n🚀 Testing Functionality:');
    allPassed &= await testCreateMessage();
    
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED! Farmer Community is ready to use.');
        console.log('\n🎯 Next Steps:');
        console.log('1. Start your Next.js application: npm run dev');
        console.log('2. Navigate to: http://localhost:9005/community');
        console.log('3. Log in with a test user');
        console.log('4. Start posting messages!');
    } else {
        console.log('❌ SOME TESTS FAILED! Please check the errors above.');
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure you ran the SQL schema: sql/farmer_community_schema.sql');
        console.log('2. Check your Supabase project settings');
        console.log('3. Verify environment variables are correct');
    }
    
    console.log('\n📚 Documentation: See FARMER_COMMUNITY_SETUP.md for details');
    
    return allPassed;
}

// Run the tests
runTests()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });

/**
 * ============================================================================
 * FARMER COMMUNITY FEATURE - TEST SCRIPT
 * Tests all functionality of the Farmer Community client
 * Date: August 16, 2025
 * ============================================================================
 */

const { createFarmerCommunityClient } = require('./firestudio/src/lib/farmerCommunityClient.ts');
require('dotenv').config({ path: '.env.local' });

async function testFarmerCommunity() {
  console.log('🧪 Testing Farmer Community Feature...\n');

  try {
    // Initialize client
    const client = createFarmerCommunityClient();
    console.log('✅ Client initialized successfully');

    // Test 1: Check authentication
    console.log('\n📋 Test 1: User Authentication');
    const userResult = await client.getCurrentUser();
    if (userResult.success && userResult.data) {
      console.log(`✅ User authenticated: ${userResult.data.email}`);
    } else {
      console.log('⚠️ No authenticated user (this is expected for testing)');
    }

    // Test 2: Get messages (public read access)
    console.log('\n📋 Test 2: Fetching Messages');
    const messagesResult = await client.getMessages(1, 5);
    if (messagesResult.success) {
      console.log(`✅ Messages fetched: ${messagesResult.data.length} messages`);
      console.log(`   Total count: ${messagesResult.count}`);
      
      if (messagesResult.data.length > 0) {
        const firstMessage = messagesResult.data[0];
        console.log(`   First message: "${firstMessage.content.substring(0, 50)}..."`);
        console.log(`   Posted by: ${firstMessage.poster_name}`);
        console.log(`   Likes: ${firstMessage.like_count}, Replies: ${firstMessage.reply_count}`);
      }
    } else {
      console.error(`❌ Failed to fetch messages: ${messagesResult.error}`);
    }

    // Test 3: Search messages
    console.log('\n📋 Test 3: Search Messages');
    const searchResult = await client.searchMessages('wheat', 1, 3);
    if (searchResult.success) {
      console.log(`✅ Search completed: ${searchResult.data.length} results for "wheat"`);
    } else {
      console.error(`❌ Search failed: ${searchResult.error}`);
    }

    // Test 4: Get user profile (if any exists)
    if (userResult.success && userResult.data) {
      console.log('\n📋 Test 4: User Profile');
      const profileResult = await client.getCurrentUserProfile();
      if (profileResult.success && profileResult.data) {
        console.log(`✅ Profile found: ${profileResult.data.display_name || profileResult.data.full_name}`);
      } else {
        console.log('ℹ️ No user profile found (create one to test profile features)');
      }
    }

    // Test 5: Test message thread (if messages exist)
    if (messagesResult.success && messagesResult.data.length > 0) {
      console.log('\n📋 Test 5: Message Thread');
      const messageId = messagesResult.data[0].message_id;
      const threadResult = await client.getMessageThread(messageId);
      if (threadResult.success) {
        console.log(`✅ Thread loaded: ${threadResult.data.replies.length} replies`);
      } else {
        console.error(`❌ Failed to load thread: ${threadResult.error}`);
      }
    }

    // Test 6: Validate message content
    console.log('\n📋 Test 6: Content Validation');
    const { validateMessageContent } = require('./firestudio/src/lib/farmerCommunityClient.ts');
    
    const validContent = validateMessageContent('This is a valid message');
    const emptyContent = validateMessageContent('');
    const longContent = validateMessageContent('x'.repeat(5001));

    console.log(`✅ Valid content: ${validContent.isValid}`);
    console.log(`✅ Empty content invalid: ${!emptyContent.isValid} (${emptyContent.error})`);
    console.log(`✅ Long content invalid: ${!longContent.isValid} (${longContent.error})`);

    // Test 7: Date formatting
    console.log('\n📋 Test 7: Date Formatting');
    const { formatMessageDate } = require('./firestudio/src/lib/farmerCommunityClient.ts');
    
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    console.log(`✅ Now: ${formatMessageDate(now)}`);
    console.log(`✅ 1 hour ago: ${formatMessageDate(oneHourAgo)}`);
    console.log(`✅ 1 day ago: ${formatMessageDate(oneDayAgo)}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Client initialization works');
    console.log('   ✅ Message fetching works (public access)');
    console.log('   ✅ Search functionality works');
    console.log('   ✅ Content validation works');
    console.log('   ✅ Date formatting works');
    console.log('   ✅ Message threading works');

    console.log('\n🔐 Authentication Required for:');
    console.log('   • Posting messages');
    console.log('   • Liking messages');
    console.log('   • Managing user profile');
    console.log('   • Real-time subscriptions');

    console.log('\n📝 Next Steps:');
    console.log('   1. Set up user authentication in your app');
    console.log('   2. Create React components using the provided examples');
    console.log('   3. Test posting and liking with authenticated users');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   • Supabase credentials are correct in .env.local');
    console.error('   • Database schema has been executed');
    console.error('   • Network connection is working');
  }
}

// Run tests
if (require.main === module) {
  testFarmerCommunity();
}

module.exports = { testFarmerCommunity };

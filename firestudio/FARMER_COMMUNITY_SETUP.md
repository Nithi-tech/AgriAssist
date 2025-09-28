# 🌾 Farmer Community Feature - Implementation Guide

## Overview

The Farmer Community feature allows farmers to:
- Post public messages with optional images
- Reply to messages (threaded conversations)
- Like/unlike messages and replies
- View messages in reverse chronological order
- See poster names, message text, like counts, and threaded replies

## 📊 Database Schema

### Tables Created:

1. **`community_messages`** - Stores all posts and replies
   - `message_id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth_users)
   - `parent_id` (UUID, Foreign Key to community_messages, nullable)
   - `content` (TEXT, 1-2000 characters)
   - `image_url` (TEXT, optional)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **`community_likes`** - Tracks message likes
   - `like_id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth_users)
   - `message_id` (UUID, Foreign Key to community_messages)
   - `created_at` (TIMESTAMP)
   - Unique constraint on (user_id, message_id)

### Views and Functions:

- **`community_messages_with_details`** - View with user details and like counts
- **`get_message_thread()`** - Function to retrieve complete message threads

## 🚀 Setup Instructions

### Step 1: Database Setup

1. **Access your Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Navigate to SQL Editor**

3. **Execute the schema file**:
   - Copy and paste the entire content from: `sql/farmer_community_schema.sql`
   - Click "Run" to execute the SQL

### Step 2: Verify Installation

Run this query in Supabase SQL Editor to verify tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('community_messages', 'community_likes');

-- Check if view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'community_messages_with_details';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_message_thread';
```

### Step 3: Environment Variables

Ensure your `.env.local` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Install Dependencies

The community client uses existing dependencies:
- `@supabase/supabase-js` (already installed)
- React/Next.js (already set up)

### Step 5: Add to Your Application

1. **Import the community client**:
   ```typescript
   import { communityClient } from '../lib/communityClient';
   ```

2. **Use the React component**:
   ```tsx
   import { FarmerCommunity } from '../components/FarmerCommunity';
   
   // In your page/component:
   <FarmerCommunity 
     currentUserId={user.id}
     currentUserName={user.name}
   />
   ```

3. **Add routing** (if using Next.js App Router):
   - The community page is available at `/community`
   - Customize the route in `src/app/community/page.tsx`

## 🔧 API Usage Examples

### Post a Message

```typescript
import { communityClient } from '../lib/communityClient';

const result = await communityClient.postMessage({
  content: "Just harvested my first tomato crop! 🍅",
  image_url: "https://example.com/tomato.jpg"
}, userId);

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Posted:', result.data);
}
```

### Reply to a Message

```typescript
const result = await communityClient.replyToMessage(
  parentMessageId,
  "Congratulations! What variety did you grow?",
  userId
);
```

### Like/Unlike a Message

```typescript
const result = await communityClient.toggleLike(messageId, userId);

if (result.data) {
  console.log(`Message ${result.data.liked ? 'liked' : 'unliked'}`);
  console.log(`New like count: ${result.data.likeCount}`);
}
```

### Fetch Messages

```typescript
// Get all main posts
const posts = await communityClient.getAllMainPosts(50, 0);

// Get replies for a message
const replies = await communityClient.getMessageReplies(messageId);

// Get complete thread
const thread = await communityClient.getMessageThread(messageId);

// Search messages
const searchResults = await communityClient.searchMessages("tomato");
```

## 🔒 Security Features

### Row Level Security (RLS)

- **Messages**: 
  - Anyone can read all messages
  - Users can only create/update/delete their own messages
  
- **Likes**: 
  - Anyone can read all likes
  - Users can only create/delete their own likes
  - Unique constraint prevents duplicate likes

### Data Validation

- Message content: 1-2000 characters
- Prevents empty messages
- SQL injection protection via parameterized queries
- Input sanitization on client side

### Rate Limiting

Consider implementing rate limiting for:
- Message posting (e.g., max 10 posts per hour)
- Like actions (prevent rapid like/unlike)

## 📱 Mobile Responsive Design

The React component includes:
- Responsive layouts using Tailwind CSS
- Touch-friendly buttons and interactions
- Optimized for mobile farming use cases
- Offline-friendly design patterns

## 🎨 Customization Options

### Styling

The component uses Tailwind CSS classes. Customize by:

1. **Colors**: Change green theme to your brand colors
2. **Typography**: Adjust font sizes and families
3. **Layout**: Modify spacing and container widths
4. **Icons**: Replace emoji with custom icons

### Features

Extend functionality by:

1. **Image Upload**: Add file upload instead of URL input
2. **Mentions**: Add @user mention functionality  
3. **Hashtags**: Add #topic categorization
4. **Notifications**: Alert users of replies/likes
5. **Moderation**: Add report/flag functionality

### Multilingual Support

Add i18n support for:
- Interface text
- Error messages
- Date/time formatting
- Content direction (RTL support)

## 🔍 Monitoring and Analytics

Track usage with:

```typescript
// Get community statistics
const stats = await communityClient.getCommunityStats();

console.log('Community Stats:', {
  totalMessages: stats.data?.totalMessages,
  totalMainPosts: stats.data?.totalMainPosts, 
  totalReplies: stats.data?.totalReplies,
  totalLikes: stats.data?.totalLikes,
  activeUsers: stats.data?.activeUsers
});
```

## 🐛 Troubleshooting

### Common Issues

1. **"Permission denied" errors**:
   - Check RLS policies are correctly applied
   - Verify user authentication
   - Ensure correct user_id is being passed

2. **"Function not found" errors**:
   - Verify `get_message_thread` function was created
   - Check function permissions

3. **Images not loading**:
   - Validate image URLs
   - Add error handling for broken images
   - Consider using Supabase Storage for uploads

4. **Performance issues**:
   - Check database indexes are applied
   - Monitor query performance in Supabase dashboard
   - Consider pagination for large datasets

### Debug Mode

Enable debug logging:

```typescript
// Add to your environment variables
NEXT_PUBLIC_DEBUG_COMMUNITY=true

// The client will log all operations
```

## 🚀 Production Deployment

### Before Going Live:

1. **Remove sample data** from SQL schema
2. **Set up monitoring** for database performance
3. **Configure backups** for community data
4. **Test with real users** and various data loads
5. **Set up analytics** to track feature usage
6. **Plan moderation tools** for content management

### Performance Optimization:

1. **Database**:
   - Monitor slow queries
   - Add additional indexes if needed
   - Consider materialized views for analytics

2. **Frontend**:
   - Implement virtual scrolling for large lists
   - Add image lazy loading
   - Cache frequently accessed data

3. **Real-time Updates**:
   - Consider adding Supabase real-time subscriptions
   - Implement optimistic UI updates

## 📞 Support

For issues with this implementation:

1. Check the Supabase dashboard logs
2. Review browser console for client-side errors
3. Test database queries directly in SQL Editor
4. Verify environment variables and authentication

## 🎯 Next Steps

Consider adding these advanced features:

1. **Rich Text Editor**: Allow formatted text in messages
2. **File Attachments**: Support multiple file types
3. **Voice Messages**: Add audio recording capability
4. **Video Support**: Enable video sharing
5. **Geolocation**: Tag messages with farm locations
6. **Weather Integration**: Show weather in posts
7. **Crop Tracking**: Link messages to specific crops
8. **Expert Verification**: Highlight verified agricultural experts

The Farmer Community feature is now ready for production use! 🌾

# 🌾 Farmer Community Feature - Complete Setup Guide

## Overview

The Farmer Community feature provides a threaded messaging system where farmers can:
- Post public messages with optional images
- Reply to messages in threaded conversations
- Like/unlike messages and replies
- View messages in reverse chronological order
- Search for specific content

## 📊 Database Schema

### Tables Created

1. **`messages`** - Stores all community messages and replies
2. **`likes`** - Tracks user likes on messages
3. **`user_profiles`** - User information and display details

### Key Features

- ✅ Threaded conversations with `parent_id` relationships
- ✅ Row Level Security (RLS) for data protection
- ✅ Full-text search capabilities
- ✅ Performance-optimized indexes
- ✅ Real-time subscriptions support
- ✅ Automatic timestamp management

## 🚀 Setup Instructions

### Step 1: Run SQL Schema

1. **Go to your Supabase Dashboard**
   - Open [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to your project
   - Go to SQL Editor

2. **Execute the Schema**
   ```sql
   -- Copy and paste the entire content of FARMER_COMMUNITY_SCHEMA.sql
   -- This will create all necessary tables, indexes, and security policies
   ```

3. **Verify Setup**
   ```sql
   -- Check if tables were created
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('messages', 'likes', 'user_profiles');

   -- Verify sample data
   SELECT * FROM messages_with_details LIMIT 5;
   ```

### Step 2: Install Dependencies

Your project already has the required dependencies in `package.json`:

```json
{
  "@supabase/supabase-js": "^2.55.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/ssr": "^0.6.1"
}
```

### Step 3: Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 💻 Usage Examples

### Basic Setup

```typescript
import { createFarmerCommunityClient } from '@/lib/farmerCommunityClient';

// Initialize the client
const farmerCommunity = createFarmerCommunityClient();
```

### 1. Post a Message

```typescript
async function postMessage() {
  const result = await farmerCommunity.postMessage({
    content: "Just harvested my wheat crop! Got 45 quintals per acre this season. 🌾",
    image_url: "https://example.com/wheat-harvest.jpg" // Optional
  });

  if (result.success) {
    console.log('Message posted:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}
```

### 2. Reply to a Message

```typescript
async function replyToMessage(parentMessageId: string) {
  const result = await farmerCommunity.postMessage({
    content: "That's an excellent yield! What variety did you plant?",
    parent_id: parentMessageId
  });

  if (result.success) {
    console.log('Reply posted:', result.data);
  }
}
```

### 3. Get Messages with Pagination

```typescript
async function loadMessages() {
  const result = await farmerCommunity.getMessages(1, 20); // page 1, 20 messages

  if (result.success) {
    console.log('Messages:', result.data);
    console.log('Total count:', result.count);
    console.log('Has more:', result.hasMore);
  }
}
```

### 4. Get a Message Thread

```typescript
async function loadMessageThread(messageId: string) {
  const result = await farmerCommunity.getMessageThread(messageId);

  if (result.success) {
    console.log('Main message:', result.data.mainMessage);
    console.log('Replies:', result.data.replies);
  }
}
```

### 5. Like/Unlike Messages

```typescript
async function toggleLike(messageId: string) {
  const result = await farmerCommunity.toggleLike(messageId);

  if (result.success) {
    console.log('Liked:', result.data.liked);
    console.log('Like count:', result.data.likeCount);
  }
}
```

### 6. Search Messages

```typescript
async function searchMessages(query: string) {
  const result = await farmerCommunity.searchMessages(query, 1, 10);

  if (result.success) {
    console.log('Search results:', result.data);
  }
}
```

### 7. User Profile Management

```typescript
async function updateProfile() {
  const result = await farmerCommunity.upsertUserProfile({
    display_name: "FarmExpert123",
    full_name: "John Doe",
    location: "Punjab, India",
    bio: "Organic farming enthusiast with 15 years experience",
    user_type: "farmer"
  });

  if (result.success) {
    console.log('Profile updated:', result.data);
  }
}
```

## 🔄 Real-time Features

### Subscribe to New Messages

```typescript
function setupMessageSubscription() {
  const subscription = farmerCommunity.subscribeToMessages((newMessage) => {
    console.log('New message received:', newMessage);
    // Update your UI with the new message
  });

  // Don't forget to unsubscribe when component unmounts
  return () => subscription.unsubscribe();
}
```

### Subscribe to Like Changes

```typescript
function setupLikeSubscription() {
  const subscription = farmerCommunity.subscribeToLikes((like, event) => {
    console.log(`Like ${event}:`, like);
    // Update like counts in your UI
  });

  return () => subscription.unsubscribe();
}
```

## 🎨 React Component Examples

### Message Component

```tsx
import React from 'react';
import { MessageWithDetails, formatMessageDate } from '@/lib/farmerCommunityClient';

interface MessageComponentProps {
  message: MessageWithDetails;
  onLike: (messageId: string) => void;
  onReply: (messageId: string) => void;
}

export function MessageComponent({ message, onLike, onReply }: MessageComponentProps) {
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        {message.avatar_url && (
          <img 
            src={message.avatar_url} 
            alt={message.poster_name}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900">{message.poster_name}</h4>
            <span className="text-sm text-gray-500">{message.user_type}</span>
            <span className="text-sm text-gray-400">
              {formatMessageDate(message.created_at)}
            </span>
          </div>
          
          <p className="mt-2 text-gray-800">{message.content}</p>
          
          {message.image_url && (
            <img 
              src={message.image_url} 
              alt="Message attachment"
              className="mt-3 max-w-md rounded-lg"
            />
          )}
          
          <div className="mt-4 flex items-center space-x-4">
            <button 
              onClick={() => onLike(message.message_id)}
              className={`flex items-center space-x-1 ${
                message.user_liked ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <span>{message.user_liked ? '❤️' : '🤍'}</span>
              <span>{message.like_count}</span>
            </button>
            
            <button 
              onClick={() => onReply(message.message_id)}
              className="flex items-center space-x-1 text-gray-600"
            >
              <span>💬</span>
              <span>{message.reply_count} replies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Message Form Component

```tsx
import React, { useState } from 'react';
import { validateMessageContent } from '@/lib/farmerCommunityClient';

interface MessageFormProps {
  onSubmit: (content: string, imageUrl?: string) => void;
  placeholder?: string;
  isReply?: boolean;
}

export function MessageForm({ onSubmit, placeholder = "Share your farming experience...", isReply = false }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsSubmitting(true);
    await onSubmit(content, imageUrl || undefined);
    setContent('');
    setImageUrl('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={isReply ? 3 : 4}
        className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        disabled={isSubmitting}
      />
      
      <div className="mt-3 flex items-center justify-between">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="flex-1 mr-3 border border-gray-300 rounded-md p-2 text-sm"
          disabled={isSubmitting}
        />
        
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : (isReply ? 'Reply' : 'Post')}
        </button>
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        {content.length}/5000 characters
      </div>
    </form>
  );
}
```

## 🔧 Database Management

### Useful SQL Queries

```sql
-- Get top contributors
SELECT 
  up.display_name,
  COUNT(m.message_id) as message_count,
  SUM(CASE WHEN m.parent_id IS NULL THEN 1 ELSE 0 END) as posts,
  SUM(CASE WHEN m.parent_id IS NOT NULL THEN 1 ELSE 0 END) as replies
FROM user_profiles up
LEFT JOIN messages m ON up.id = m.user_id
GROUP BY up.id, up.display_name
ORDER BY message_count DESC
LIMIT 10;

-- Get most liked messages
SELECT 
  m.content,
  up.display_name,
  COUNT(l.like_id) as like_count
FROM messages m
LEFT JOIN likes l ON m.message_id = l.message_id
LEFT JOIN user_profiles up ON m.user_id = up.id
WHERE m.parent_id IS NULL
GROUP BY m.message_id, m.content, up.display_name
ORDER BY like_count DESC
LIMIT 10;

-- Get recent activity
SELECT 
  'message' as activity_type,
  m.created_at,
  up.display_name,
  m.content
FROM messages m
LEFT JOIN user_profiles up ON m.user_id = up.id
UNION ALL
SELECT 
  'like' as activity_type,
  l.created_at,
  up.display_name,
  'liked a message'
FROM likes l
LEFT JOIN user_profiles up ON l.user_id = up.id
ORDER BY created_at DESC
LIMIT 20;
```

## 🛡️ Security Features

### Row Level Security (RLS)

- **Messages**: Public read, authenticated write
- **Likes**: Public read, users can only manage their own likes
- **User Profiles**: Public read, users can only edit their own profile

### Data Validation

- Message content: 1-5000 characters
- Unique likes per user per message
- Proper foreign key relationships
- Automatic timestamp management

## 🚨 Error Handling

The client includes comprehensive error handling:

```typescript
const result = await farmerCommunity.postMessage({ content: "Hello!" });

if (!result.success) {
  switch (result.error) {
    case 'User must be authenticated to post messages':
      // Redirect to login
      break;
    case 'Message content cannot be empty':
      // Show validation error
      break;
    default:
      // Handle generic error
      console.error('Unexpected error:', result.error);
  }
}
```

## 📈 Performance Optimization

### Database Indexes

- Message queries by user, date, parent relationship
- Full-text search on message content
- Like counts and user likes optimization

### Pagination

- Built-in pagination support
- Configurable page sizes
- Efficient offset-based queries

### Caching Recommendations

```typescript
// Use React Query or SWR for caching
import { useQuery } from 'react-query';

function useMessages(page = 1) {
  return useQuery(
    ['messages', page],
    () => farmerCommunity.getMessages(page, 20),
    {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    }
  );
}
```

## 🧪 Testing

### Test the Setup

1. **Post a message**:
   ```typescript
   await farmerCommunity.postMessage({
     content: "Test message from the new community feature! 🌾"
   });
   ```

2. **Fetch messages**:
   ```typescript
   const messages = await farmerCommunity.getMessages();
   console.log(messages);
   ```

3. **Test likes**:
   ```typescript
   const messageId = "your-message-id";
   await farmerCommunity.toggleLike(messageId);
   ```

## 🎯 Next Steps

1. **Create UI Components**: Build React components using the examples above
2. **Add Image Upload**: Integrate with Supabase Storage for image uploads
3. **Implement Notifications**: Add email/push notifications for new replies
4. **Add Moderation**: Build admin tools for content moderation
5. **Enhance Search**: Add filters by date, user type, etc.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

**🎉 Your Farmer Community feature is now ready to use!** The schema provides a solid foundation for a production-ready community platform with all the features you requested.

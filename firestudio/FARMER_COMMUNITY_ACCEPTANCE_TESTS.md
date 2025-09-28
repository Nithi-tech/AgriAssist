# Farmer Community Chat - Acceptance Testing Checklist

## Prerequisites
1. **Database Setup**
   - [ ] Run the SQL migration: `FARMER_COMMUNITY_CHAT_MIGRATION.sql`
   - [ ] Verify tables created: `messages`, `likes`, `replies`
   - [ ] Verify RLS policies are active
   - [ ] Verify realtime is enabled for all tables

2. **Environment Variables**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
   - [ ] Supabase Auth is properly configured

3. **Dependencies**
   - [ ] Install react-hot-toast: `npm install react-hot-toast`
   - [ ] All other dependencies should already be installed

## Manual Testing Scenarios

### Authentication Tests
- [ ] **T1.1**: Visit `/community` while logged out
  - Expected: Welcome screen with "Sign In to Join Chat" button
  - Should not see any messages or chat input

- [ ] **T1.2**: Click "Sign In" button
  - Expected: OAuth flow starts (Google login)
  - After successful login, should see chat interface

- [ ] **T1.3**: Sign out using header button
  - Expected: Returns to welcome screen
  - Cannot send messages without authentication

### Real-time Messaging Tests
- [ ] **T2.1**: Multi-user real-time messaging
  - Open Chrome browser, log in as User A
  - Open Firefox browser, log in as User B
  - User A sends message "Hello from A"
  - Expected: Message appears instantly on User B's screen
  - User B replies "Hi A, this is B"
  - Expected: Reply appears instantly on User A's screen

- [ ] **T2.2**: Message ordering and timestamps
  - Send multiple messages rapidly
  - Expected: Messages appear in chronological order (oldest at top)
  - Expected: Each message shows correct timestamp (e.g., "10:42 AM")
  - Expected: Date separators appear for different days

### Likes System Tests
- [ ] **T3.1**: Like/unlike functionality
  - User A sends a message
  - User B likes the message
  - Expected: Like count increments from 0 to 1 on both screens within ~1 second
  - Expected: Heart icon turns red and fills for User B
  - User B unlikes the message
  - Expected: Like count decrements to 0 on both screens
  - Expected: Heart icon returns to gray outline

- [ ] **T3.2**: Prevent double-liking
  - Try to like the same message multiple times rapidly
  - Expected: Like count should only increment once
  - Expected: Database constraint prevents duplicate likes

- [ ] **T3.3**: Optimistic UI updates
  - With slow network, click like button
  - Expected: UI updates immediately (optimistic)
  - If network fails, like should revert
  - If network succeeds, like should persist

### Reply System Tests
- [ ] **T4.1**: Basic reply functionality
  - User A sends main message "What's the weather like?"
  - User B clicks "Reply" button
  - Expected: Reply input appears below message
  - User B types "It's sunny here!" and presses Enter
  - Expected: Reply appears indented under main message on both screens
  - Expected: Reply shows User B's name and timestamp

- [ ] **T4.2**: Multiple replies to same message
  - User C also replies to User A's weather message
  - Expected: Both replies appear under the main message
  - Expected: Replies are ordered by creation time (oldest first)

- [ ] **T4.3**: Reply input controls
  - Click "Reply" to open input
  - Press Escape key
  - Expected: Reply input disappears
  - Open reply input again, type message, click X button
  - Expected: Reply input closes without sending

### Data Persistence Tests
- [ ] **T5.1**: Page refresh persistence
  - Send several messages with likes and replies
  - Refresh both browser windows
  - Expected: Last 50 messages load in correct order
  - Expected: All like counts are accurate
  - Expected: All replies appear under correct messages

- [ ] **T5.2**: Cross-session persistence
  - Close and reopen browsers
  - Log back in
  - Expected: Previous messages still visible
  - Expected: User's previous likes are remembered (hearts filled)

### UI/UX Tests
- [ ] **T6.1**: Auto-scroll behavior
  - Scroll up to read older messages
  - Another user sends a new message
  - Expected: Chat does NOT auto-scroll (user maintains position)
  - Scroll to bottom
  - New message arrives
  - Expected: Chat auto-scrolls to show new message

- [ ] **T6.2**: Message input behavior
  - Type message and press Enter
  - Expected: Message sends, input clears
  - Type message and press Shift+Enter
  - Expected: New line added, message not sent
  - Try to send empty/whitespace-only message
  - Expected: Nothing happens, input validation prevents send

- [ ] **T6.3**: Responsive design
  - Test on mobile screen size
  - Expected: Chat remains usable and readable
  - Expected: Input area adapts to screen size
  - Expected: Username truncation works properly

### Error Handling Tests
- [ ] **T7.1**: Network disconnection
  - Disconnect internet while using chat
  - Expected: "Connection lost" toast appears
  - Expected: Header shows "Offline" status
  - Try to send message
  - Expected: Input is disabled with appropriate message
  - Reconnect internet
  - Expected: "Connection restored" toast appears
  - Expected: Header shows "Online" status

- [ ] **T7.2**: Database errors
  - Test with invalid Supabase credentials
  - Expected: Appropriate error messages
  - Expected: App doesn't crash, shows error state

### Security Tests (RLS)
- [ ] **T8.1**: Unauthenticated access
  - Open browser dev tools, go to Network tab
  - Try to manually query Supabase tables while logged out
  - Expected: All queries should fail with authentication errors

- [ ] **T8.2**: Authenticated user permissions
  - Logged in user should be able to:
    - [ ] Read all messages, likes, replies
    - [ ] Insert their own messages, likes, replies
    - [ ] Delete their own likes (unlike)
  - Logged in user should NOT be able to:
    - [ ] Delete other users' data
    - [ ] Insert data with other users' IDs

## Performance Tests
- [ ] **T9.1**: Load time
  - Fresh page load should complete within 3 seconds
  - Initial message load should be fast (< 1 second)

- [ ] **T9.2**: Real-time latency
  - Message should appear on other screens within 1-2 seconds
  - Like/unlike should update within 1 second

## Edge Cases
- [ ] **T10.1**: Very long messages
  - Send message with 1000+ characters
  - Expected: Message displays properly with word wrapping

- [ ] **T10.2**: Special characters
  - Send messages with emojis, unicode characters
  - Expected: All characters display correctly

- [ ] **T10.3**: Rapid interactions
  - Send messages very quickly
  - Like/unlike rapidly
  - Expected: No race conditions or duplicate data

## Success Criteria
✅ All tests above pass
✅ No console errors during normal usage
✅ Real-time updates work consistently between multiple users
✅ Authentication flow works smoothly
✅ Data persists correctly across sessions
✅ App is responsive and performant

## Test Environment Setup Commands

```bash
# Navigate to project directory
cd firestudio

# Install missing dependency
npm install react-hot-toast

# Run development server
npm run dev

# In Supabase dashboard, run the migration SQL:
# Copy contents of FARMER_COMMUNITY_CHAT_MIGRATION.sql and execute

# Set up test users (use different browsers/incognito)
# Open http://localhost:9005/community in multiple browsers
```

## Common Issues & Solutions

**Issue**: "Missing environment variables"
**Solution**: Check `.env.local` has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

**Issue**: "Auth not working"
**Solution**: Verify Supabase Auth settings and OAuth provider configuration

**Issue**: "Realtime not updating"
**Solution**: Check that tables are added to supabase_realtime publication

**Issue**: "RLS blocking queries"
**Solution**: Verify RLS policies are correctly created and user is authenticated

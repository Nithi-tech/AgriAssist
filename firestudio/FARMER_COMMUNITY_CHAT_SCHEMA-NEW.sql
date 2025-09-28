-- ==================================================================
-- FARMER COMMUNITY CHAT SYSTEM - COMPLETE DATABASE SCHEMA
-- ==================================================================
-- This schema creates all tables, RLS policies, triggers, and functions
-- needed for the real-time farmer community chat system with voice messages
-- 
-- Features:
-- ✅ Farmer profiles with online status
-- ✅ Text and voice messages
-- ✅ Real-time typing indicators
-- ✅ Message replies and threading
-- ✅ Voice message storage integration
-- ✅ Row Level Security (RLS) policies
-- ✅ Real-time triggers for Supabase subscriptions
-- ✅ Automatic cleanup functions
-- ==================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==================================================================
-- 1. FARMER PROFILES TABLE
-- ==================================================================
-- Stores farmer information and online status
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL UNIQUE, -- F001, F002, etc.
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(200),
    phone_number VARCHAR(20),
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_farmer_id CHECK (farmer_id ~ '^F\d{3,}$'),
    CONSTRAINT valid_display_name CHECK (char_length(display_name) >= 2),
    CONSTRAINT valid_bio CHECK (char_length(bio) <= 500)
);

-- Indexes for farmer_profiles
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_farmer_id ON farmer_profiles(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_online ON farmer_profiles(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_last_seen ON farmer_profiles(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_created_at ON farmer_profiles(created_at);

-- ==================================================================
-- 2. FARMER COMMUNITY MESSAGES TABLE
-- ==================================================================
-- Stores all chat messages (text and voice)
CREATE TABLE IF NOT EXISTS farmer_community_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_profile_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    content TEXT, -- For text messages
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    voice_url TEXT, -- For voice messages (Supabase Storage URL)
    voice_duration INTEGER, -- Duration in seconds
    reply_to_message_id UUID REFERENCES farmer_community_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'voice', 'system')),
    CONSTRAINT text_message_has_content CHECK (
        (message_type = 'text' AND content IS NOT NULL AND char_length(content) > 0) OR
        (message_type = 'voice' AND voice_url IS NOT NULL AND voice_duration > 0) OR
        (message_type = 'system')
    ),
    CONSTRAINT valid_content_length CHECK (char_length(content) <= 2000),
    CONSTRAINT valid_voice_duration CHECK (voice_duration IS NULL OR voice_duration BETWEEN 1 AND 120),
    CONSTRAINT no_self_reply CHECK (reply_to_message_id != id)
);

-- Indexes for farmer_community_messages
CREATE INDEX IF NOT EXISTS idx_messages_farmer_profile ON farmer_community_messages(farmer_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON farmer_community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON farmer_community_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON farmer_community_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON farmer_community_messages(created_at DESC) WHERE is_deleted = FALSE;

-- ==================================================================
-- 3. TYPING INDICATORS TABLE
-- ==================================================================
-- Tracks real-time typing status
CREATE TABLE IF NOT EXISTS farmer_typing_indicators (
    farmer_profile_id UUID PRIMARY KEY REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_active ON farmer_typing_indicators(updated_at DESC) WHERE is_typing = TRUE;

-- ==================================================================
-- 4. MESSAGE REACTIONS TABLE (Optional for future enhancement)
-- ==================================================================
-- Stores message reactions/emojis
CREATE TABLE IF NOT EXISTS farmer_message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES farmer_community_messages(id) ON DELETE CASCADE,
    farmer_profile_id UUID NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one reaction type per farmer per message
    UNIQUE(message_id, farmer_profile_id, emoji),
    
    -- Constraints
    CONSTRAINT valid_emoji CHECK (char_length(emoji) BETWEEN 1 AND 10)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message ON farmer_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_farmer ON farmer_message_reactions(farmer_profile_id);

-- ==================================================================
-- 5. SUPABASE STORAGE BUCKET SETUP
-- ==================================================================
-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'voice-messages',
    'voice-messages',
    true,
    5242880, -- 5MB limit
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================================

-- Enable RLS on all tables
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read farmer profiles (for chat display)
CREATE POLICY "Allow read farmer profiles" ON farmer_profiles
    FOR SELECT USING (TRUE);

-- Policy: Farmers can update their own profile
CREATE POLICY "Allow update own profile" ON farmer_profiles
    FOR UPDATE USING (TRUE); -- Simplified for demo, add auth logic as needed

-- Policy: Farmers can insert their own profile
CREATE POLICY "Allow insert own profile" ON farmer_profiles
    FOR INSERT WITH CHECK (TRUE); -- Simplified for demo

-- Policy: Anyone can read messages (public chat)
CREATE POLICY "Allow read messages" ON farmer_community_messages
    FOR SELECT USING (is_deleted = FALSE);

-- Policy: Authenticated users can send messages
CREATE POLICY "Allow insert messages" ON farmer_community_messages
    FOR INSERT WITH CHECK (TRUE); -- Simplified for demo

-- Policy: Users can update their own messages
CREATE POLICY "Allow update own messages" ON farmer_community_messages
    FOR UPDATE USING (TRUE); -- Add proper user matching in production

-- Policy: Users can soft delete their own messages
CREATE POLICY "Allow delete own messages" ON farmer_community_messages
    FOR DELETE USING (TRUE); -- Add proper user matching in production

-- Policy: Anyone can read typing indicators
CREATE POLICY "Allow read typing indicators" ON farmer_typing_indicators
    FOR SELECT USING (TRUE);

-- Policy: Users can manage their own typing status
CREATE POLICY "Allow manage own typing" ON farmer_typing_indicators
    FOR ALL USING (TRUE); -- Simplified for demo

-- Policy: Anyone can read reactions
CREATE POLICY "Allow read reactions" ON farmer_message_reactions
    FOR SELECT USING (TRUE);

-- Policy: Users can manage their own reactions
CREATE POLICY "Allow manage own reactions" ON farmer_message_reactions
    FOR ALL USING (TRUE); -- Simplified for demo

-- ==================================================================
-- 7. STORAGE POLICIES
-- ==================================================================

-- Policy: Anyone can upload voice messages
CREATE POLICY "Allow voice message uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'voice-messages');

-- Policy: Anyone can read voice messages (public access)
CREATE POLICY "Allow voice message downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'voice-messages');

-- Policy: Users can delete their own voice messages
CREATE POLICY "Allow delete own voice messages" ON storage.objects
    FOR DELETE USING (bucket_id = 'voice-messages'); -- Add user matching in production

-- ==================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- ==================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on farmer_profiles
CREATE TRIGGER update_farmer_profiles_updated_at
    BEFORE UPDATE ON farmer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON farmer_community_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-cleanup old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    -- Clear typing indicators older than 30 seconds
    UPDATE farmer_typing_indicators 
    SET is_typing = FALSE 
    WHERE is_typing = TRUE 
    AND updated_at < NOW() - INTERVAL '30 seconds';
    
    -- Delete very old typing records (older than 1 hour)
    DELETE FROM farmer_typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-cleanup offline users
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
    -- Set users offline if no activity for 5 minutes
    UPDATE farmer_profiles 
    SET is_online = FALSE 
    WHERE is_online = TRUE 
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function: Get chat statistics
CREATE OR REPLACE FUNCTION get_chat_statistics()
RETURNS TABLE (
    total_farmers INTEGER,
    online_farmers INTEGER,
    total_messages INTEGER,
    messages_today INTEGER,
    voice_messages INTEGER,
    active_conversations INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM farmer_profiles),
        (SELECT COUNT(*)::INTEGER FROM farmer_profiles WHERE is_online = TRUE),
        (SELECT COUNT(*)::INTEGER FROM farmer_community_messages WHERE is_deleted = FALSE),
        (SELECT COUNT(*)::INTEGER FROM farmer_community_messages WHERE DATE(created_at) = CURRENT_DATE AND is_deleted = FALSE),
        (SELECT COUNT(*)::INTEGER FROM farmer_community_messages WHERE message_type = 'voice' AND is_deleted = FALSE),
        (SELECT COUNT(DISTINCT farmer_profile_id)::INTEGER FROM farmer_community_messages WHERE created_at > NOW() - INTERVAL '1 hour' AND is_deleted = FALSE);
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- 9. SCHEDULED CLEANUP JOBS (Using pg_cron extension)
-- ==================================================================

-- Schedule cleanup of typing indicators every minute
SELECT cron.schedule('cleanup-typing-indicators', '* * * * *', 'SELECT cleanup_old_typing_indicators();');

-- Schedule cleanup of offline users every 5 minutes
SELECT cron.schedule('cleanup-offline-users', '*/5 * * * *', 'SELECT cleanup_offline_users();');

-- ==================================================================
-- 10. SAMPLE DATA (FOR TESTING)
-- ==================================================================

-- Insert sample farmer profiles
INSERT INTO farmer_profiles (farmer_id, display_name, bio, location) VALUES
    ('F001', 'राम शर्मा', 'गेहूं और धान की खेती करता हूं। 15 साल का अनुभव।', 'पंजाब, भारत'),
    ('F002', 'सीता देवी', 'जैविक सब्जियों की खेती में विशेषज्ञ।', 'हरियाणा, भारत'),
    ('F003', 'मोहन सिंह', 'डेयरी फार्मिंग और गाय-भैंस पालन।', 'उत्तर प्रदेश, भारत'),
    ('F004', 'गीता पटेल', 'मिश्रित खेती और बागवानी में रुचि।', 'गुजरात, भारत'),
    ('F005', 'राज कुमार', 'आधुनिक तकनीक से खेती करता हूं।', 'महाराष्ट्र, भारत')
ON CONFLICT (farmer_id) DO NOTHING;

-- Insert a welcome system message
INSERT INTO farmer_community_messages (farmer_profile_id, content, message_type)
SELECT 
    id,
    '🌾 फार्मर कम्युनिटी में आपका स्वागत है! यहां आप अन्य किसानों से चैट कर सकते हैं, अपने अनुभव साझा कर सकते हैं, और आवाज संदेश भी भेज सकते हैं। 🎤',
    'system'
FROM farmer_profiles 
WHERE farmer_id = 'F001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==================================================================
-- 11. VIEWS FOR EASIER QUERYING
-- ==================================================================

-- View: Recent messages with farmer details
CREATE OR REPLACE VIEW recent_messages AS
SELECT 
    m.id,
    m.content,
    m.message_type,
    m.voice_url,
    m.voice_duration,
    m.reply_to_message_id,
    m.is_edited,
    m.created_at,
    m.updated_at,
    fp.farmer_id,
    fp.display_name,
    fp.avatar_url,
    -- Reply message details (if any)
    rm.content AS reply_content,
    rp.display_name AS reply_farmer_name
FROM farmer_community_messages m
JOIN farmer_profiles fp ON m.farmer_profile_id = fp.id
LEFT JOIN farmer_community_messages rm ON m.reply_to_message_id = rm.id
LEFT JOIN farmer_profiles rp ON rm.farmer_profile_id = rp.id
WHERE m.is_deleted = FALSE
ORDER BY m.created_at DESC;

-- View: Online farmers with typing status
CREATE OR REPLACE VIEW online_farmers_status AS
SELECT 
    fp.id,
    fp.farmer_id,
    fp.display_name,
    fp.avatar_url,
    fp.is_online,
    fp.last_seen,
    COALESCE(ti.is_typing, FALSE) AS is_typing,
    ti.updated_at AS typing_updated_at
FROM farmer_profiles fp
LEFT JOIN farmer_typing_indicators ti ON fp.id = ti.farmer_profile_id
WHERE fp.is_online = TRUE
ORDER BY fp.last_seen DESC;

-- View: Message thread (for replies)
CREATE OR REPLACE VIEW message_threads AS
WITH RECURSIVE thread_messages AS (
    -- Base case: original messages (not replies)
    SELECT 
        id,
        farmer_profile_id,
        content,
        message_type,
        voice_url,
        voice_duration,
        reply_to_message_id,
        created_at,
        id as thread_root_id,
        0 as thread_level
    FROM farmer_community_messages 
    WHERE reply_to_message_id IS NULL AND is_deleted = FALSE
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
        m.id,
        m.farmer_profile_id,
        m.content,
        m.message_type,
        m.voice_url,
        m.voice_duration,
        m.reply_to_message_id,
        m.created_at,
        tm.thread_root_id,
        tm.thread_level + 1
    FROM farmer_community_messages m
    INNER JOIN thread_messages tm ON m.reply_to_message_id = tm.id
    WHERE m.is_deleted = FALSE
)
SELECT 
    tm.*,
    fp.farmer_id,
    fp.display_name,
    fp.avatar_url
FROM thread_messages tm
JOIN farmer_profiles fp ON tm.farmer_profile_id = fp.id
ORDER BY tm.thread_root_id, tm.thread_level, tm.created_at;

-- ==================================================================
-- 12. PERFORMANCE OPTIMIZATION
-- ==================================================================

-- Analyze tables for query optimization
ANALYZE farmer_profiles;
ANALYZE farmer_community_messages;
ANALYZE farmer_typing_indicators;
ANALYZE farmer_message_reactions;

-- ==================================================================
-- SETUP COMPLETE ✅
-- ==================================================================

-- Final verification query
SELECT 
    'farmer_profiles' AS table_name, COUNT(*) AS row_count FROM farmer_profiles
UNION ALL
SELECT 
    'farmer_community_messages' AS table_name, COUNT(*) AS row_count FROM farmer_community_messages
UNION ALL
SELECT 
    'farmer_typing_indicators' AS table_name, COUNT(*) AS row_count FROM farmer_typing_indicators
UNION ALL
SELECT 
    'farmer_message_reactions' AS table_name, COUNT(*) AS row_count FROM farmer_message_reactions;

-- Show created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename LIKE 'farmer_%'
ORDER BY tablename, indexname;

-- ==================================================================
-- USAGE EXAMPLES
-- ==================================================================

-- Example: Get recent messages
-- SELECT * FROM recent_messages LIMIT 10;

-- Example: Get online farmers
-- SELECT * FROM online_farmers_status;

-- Example: Get chat statistics
-- SELECT * FROM get_chat_statistics();

-- Example: Insert a new message
-- INSERT INTO farmer_community_messages (farmer_profile_id, content, message_type)
-- SELECT id, 'Hello from F001!', 'text' FROM farmer_profiles WHERE farmer_id = 'F001';

-- Example: Set typing indicator
-- INSERT INTO farmer_typing_indicators (farmer_profile_id, is_typing)
-- SELECT id, TRUE FROM farmer_profiles WHERE farmer_id = 'F001'
-- ON CONFLICT (farmer_profile_id) DO UPDATE SET is_typing = EXCLUDED.is_typing, updated_at = NOW();

-- ==================================================================
-- END OF SCHEMA
-- ==================================================================

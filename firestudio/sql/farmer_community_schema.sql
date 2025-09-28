-- Farmer Community Feature Database Schema
-- Run this in your Supabase SQL editor

-- Messages table for posts and replies
CREATE TABLE IF NOT EXISTS community_messages (
    message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES community_messages(message_id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table for message likes
CREATE TABLE IF NOT EXISTS community_likes (
    like_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES community_messages(message_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only like a message once
    UNIQUE(user_id, message_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id ON community_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_parent_id ON community_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_parent_created ON community_messages(parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_message_id ON community_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_message ON community_likes(user_id, message_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_community_messages_updated_at 
    BEFORE UPDATE ON community_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_community_updated_at_column();

-- Enable Row Level Security
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Messages
-- Anyone authenticated can read all messages
CREATE POLICY "Anyone can view messages" ON community_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only create messages with their own user_id
CREATE POLICY "Users can create own messages" ON community_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own messages
CREATE POLICY "Users can update own messages" ON community_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages" ON community_messages
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Likes
-- Anyone authenticated can read all likes
CREATE POLICY "Anyone can view likes" ON community_likes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only create likes with their own user_id
CREATE POLICY "Users can create own likes" ON community_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete own likes" ON community_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON community_messages TO authenticated;
GRANT ALL ON community_likes TO authenticated;
GRANT SELECT ON community_messages TO anon;
GRANT SELECT ON community_likes TO anon;

-- Create a view for messages with user details and like counts
CREATE OR REPLACE VIEW community_messages_with_details AS
SELECT 
    m.message_id,
    m.user_id,
    m.parent_id,
    m.content,
    m.image_url,
    m.created_at,
    m.updated_at,
    u.name as user_name,
    u.mobile_number,
    COALESCE(like_counts.like_count, 0) as like_count,
    CASE WHEN m.parent_id IS NULL THEN true ELSE false END as is_main_post
FROM community_messages m
LEFT JOIN auth_users u ON m.user_id = u.id
LEFT JOIN (
    SELECT 
        message_id, 
        COUNT(*) as like_count
    FROM community_likes 
    GROUP BY message_id
) like_counts ON m.message_id = like_counts.message_id
ORDER BY m.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON community_messages_with_details TO authenticated, anon;

-- Function to get message thread (main post + all replies)
CREATE OR REPLACE FUNCTION get_message_thread(main_message_id UUID)
RETURNS TABLE (
    message_id UUID,
    user_id UUID,
    parent_id UUID,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_name VARCHAR(100),
    like_count BIGINT,
    is_main_post BOOLEAN,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE message_tree AS (
        -- Base case: main message
        SELECT 
            m.message_id,
            m.user_id,
            m.parent_id,
            m.content,
            m.image_url,
            m.created_at,
            m.updated_at,
            u.name as user_name,
            COALESCE(lc.like_count, 0) as like_count,
            true as is_main_post,
            0 as level
        FROM community_messages m
        LEFT JOIN auth_users u ON m.user_id = u.id
        LEFT JOIN (
            SELECT message_id, COUNT(*) as like_count
            FROM community_likes 
            GROUP BY message_id
        ) lc ON m.message_id = lc.message_id
        WHERE m.message_id = main_message_id
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT 
            m.message_id,
            m.user_id,
            m.parent_id,
            m.content,
            m.image_url,
            m.created_at,
            m.updated_at,
            u.name as user_name,
            COALESCE(lc.like_count, 0) as like_count,
            false as is_main_post,
            mt.level + 1
        FROM community_messages m
        LEFT JOIN auth_users u ON m.user_id = u.id
        LEFT JOIN (
            SELECT message_id, COUNT(*) as like_count
            FROM community_likes 
            GROUP BY message_id
        ) lc ON m.message_id = lc.message_id
        INNER JOIN message_tree mt ON m.parent_id = mt.message_id
    )
    SELECT * FROM message_tree
    ORDER BY level, created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_message_thread(UUID) TO authenticated, anon;

-- Sample data for testing (remove in production)
-- INSERT INTO community_messages (user_id, content) VALUES 
-- ((SELECT id FROM auth_users LIMIT 1), 'Welcome to the Farmer Community! Share your experiences and connect with fellow farmers.');

COMMENT ON TABLE community_messages IS 'Stores all community posts and replies in a threaded format';
COMMENT ON TABLE community_likes IS 'Tracks likes for community messages';
COMMENT ON VIEW community_messages_with_details IS 'Enriched view of messages with user details and like counts';
COMMENT ON FUNCTION get_message_thread(UUID) IS 'Returns a complete thread starting from a main message including all nested replies';

-- ============================================================================
-- FARMER COMMUNITY FEATURE - SUPABASE SCHEMA
-- Creates tables for community messaging with threaded conversations and likes
-- Date: August 16, 2025
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- STEP 1: CREATE MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.messages(message_id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_parent_id CHECK (parent_id != message_id),
    CONSTRAINT valid_content_length CHECK (char_length(content) BETWEEN 1 AND 5000)
);

-- ============================================================================
-- STEP 2: CREATE LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.likes (
    like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(message_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one like per user per message
    UNIQUE(user_id, message_id)
);

-- ============================================================================
-- STEP 3: CREATE USER PROFILES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    user_type TEXT DEFAULT 'farmer' CHECK (user_type IN ('farmer', 'admin', 'expert')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(parent_id, created_at DESC);

-- Likes table indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_message_id ON public.likes(message_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- Full-text search index for messages
CREATE INDEX IF NOT EXISTS idx_messages_search ON public.messages 
USING gin(to_tsvector('english', content));

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS FOR AUTOMATED UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at_trigger ON public.messages;
CREATE TRIGGER update_messages_updated_at_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Function to get message thread depth
CREATE OR REPLACE FUNCTION get_message_thread_depth(msg_id UUID)
RETURNS INTEGER AS $$
DECLARE
    depth INTEGER := 0;
    current_parent UUID;
BEGIN
    SELECT parent_id INTO current_parent FROM public.messages WHERE message_id = msg_id;
    
    WHILE current_parent IS NOT NULL LOOP
        depth := depth + 1;
        SELECT parent_id INTO current_parent FROM public.messages WHERE message_id = current_parent;
        
        -- Prevent infinite loops (safety check)
        IF depth > 10 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- Function to get like count for a message
CREATE OR REPLACE FUNCTION get_like_count(msg_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.likes WHERE message_id = msg_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user liked a message
CREATE OR REPLACE FUNCTION user_liked_message(msg_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM public.likes WHERE message_id = msg_id AND user_id = usr_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: CREATE VIEWS FOR EASY DATA RETRIEVAL
-- ============================================================================

-- View for messages with user details and like counts
CREATE OR REPLACE VIEW public.messages_with_details AS
SELECT 
    m.message_id,
    m.user_id,
    m.parent_id,
    m.content,
    m.image_url,
    m.created_at,
    m.updated_at,
    
    -- User details
    COALESCE(up.display_name, up.full_name, 'Anonymous User') as poster_name,
    up.avatar_url,
    up.user_type,
    up.location as poster_location,
    
    -- Like counts
    (SELECT COUNT(*) FROM public.likes l WHERE l.message_id = m.message_id) as like_count,
    
    -- Reply counts (for main posts only)
    CASE 
        WHEN m.parent_id IS NULL THEN 
            (SELECT COUNT(*) FROM public.messages replies WHERE replies.parent_id = m.message_id)
        ELSE 0
    END as reply_count,
    
    -- Thread depth
    get_message_thread_depth(m.message_id) as thread_depth,
    
    -- Is main post or reply
    CASE WHEN m.parent_id IS NULL THEN 'post' ELSE 'reply' END as message_type
    
FROM public.messages m
LEFT JOIN public.user_profiles up ON m.user_id = up.id
ORDER BY m.created_at DESC;

-- ============================================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

-- Messages policies - Public read, authenticated write
CREATE POLICY "Anyone can view messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Likes policies
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.likes
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Anyone can view user profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 9: CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample user profiles (only if they don't exist)
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Create a sample user profile for testing
    sample_user_id := uuid_generate_v4();
    
    -- Only insert if no user profiles exist
    IF (SELECT COUNT(*) FROM public.user_profiles) = 0 THEN
        INSERT INTO public.user_profiles (
            id, 
            full_name, 
            display_name, 
            user_type, 
            location,
            bio
        ) VALUES 
        (
            sample_user_id,
            'Sample Farmer',
            'FarmGuru',
            'farmer',
            'Punjab, India',
            'Experienced farmer specializing in wheat and rice cultivation'
        );
        
        -- Insert sample messages
        INSERT INTO public.messages (
            user_id,
            content,
            created_at
        ) VALUES 
        (
            sample_user_id,
            'Welcome to the Farmer Community! 🌾 This is a place where we can share our experiences, ask questions, and help each other grow better crops. Feel free to post your farming tips and questions here!',
            NOW() - INTERVAL '2 days'
        ),
        (
            sample_user_id,
            'Just harvested my wheat crop this season. The yield was excellent! Used organic fertilizers and got 45 quintals per acre. Happy to share tips with anyone interested.',
            NOW() - INTERVAL '1 day'
        ),
        (
            sample_user_id,
            'Weather forecast shows rain for the next 3 days. Perfect timing for those who just planted their kharif crops! 🌧️',
            NOW() - INTERVAL '6 hours'
        );
        
        RAISE NOTICE '✅ Added sample user profiles and messages for testing';
    ELSE
        RAISE NOTICE 'ℹ️ User profiles already exist, skipping sample data insertion';
    END IF;
END $$;

-- ============================================================================
-- STEP 10: VERIFICATION AND STATISTICS
-- ============================================================================

DO $$
DECLARE
    messages_count INTEGER;
    likes_count INTEGER;
    profiles_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 FARMER COMMUNITY SCHEMA VERIFICATION';
    RAISE NOTICE '========================================';
    
    SELECT COUNT(*) INTO messages_count FROM public.messages;
    SELECT COUNT(*) INTO likes_count FROM public.likes;
    SELECT COUNT(*) INTO profiles_count FROM public.user_profiles;
    
    RAISE NOTICE '✅ Messages table: % records', messages_count;
    RAISE NOTICE '✅ Likes table: % records', likes_count;
    RAISE NOTICE '✅ User profiles table: % records', profiles_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Created indexes for optimal performance:';
    RAISE NOTICE '   • Messages: user_id, parent_id, created_at, full-text search';
    RAISE NOTICE '   • Likes: user_id, message_id, created_at';
    RAISE NOTICE '   • User profiles: display_name, user_type';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ Row Level Security (RLS) enabled:';
    RAISE NOTICE '   • Public read access for all content';
    RAISE NOTICE '   • Authenticated users can post messages';
    RAISE NOTICE '   • Users can only edit/delete their own content';
    RAISE NOTICE '   • Admins can moderate content';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Utility functions created:';
    RAISE NOTICE '   • get_message_thread_depth(uuid)';
    RAISE NOTICE '   • get_like_count(uuid)';
    RAISE NOTICE '   • user_liked_message(uuid, uuid)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Views created:';
    RAISE NOTICE '   • messages_with_details (includes user info and counts)';
    RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 FARMER COMMUNITY SCHEMA SETUP COMPLETED!';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created messages table with threaded conversations';
    RAISE NOTICE '✅ Created likes table with unique constraints';
    RAISE NOTICE '✅ Created user_profiles table for user details';
    RAISE NOTICE '✅ Added performance indexes and full-text search';
    RAISE NOTICE '✅ Implemented Row Level Security policies';
    RAISE NOTICE '✅ Created utility functions and views';
    RAISE NOTICE '✅ Added sample data for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 NEXT STEPS:';
    RAISE NOTICE '   1. Run the TypeScript client code provided';
    RAISE NOTICE '   2. Test posting messages and replies';
    RAISE NOTICE '   3. Test like/unlike functionality';
    RAISE NOTICE '   4. Build your frontend components';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 TEST QUERIES:';
    RAISE NOTICE '   • SELECT * FROM messages_with_details;';
    RAISE NOTICE '   • SELECT get_like_count(message_id) FROM messages LIMIT 1;';
    RAISE NOTICE '   • SELECT * FROM likes;';
    RAISE NOTICE '';
END $$;

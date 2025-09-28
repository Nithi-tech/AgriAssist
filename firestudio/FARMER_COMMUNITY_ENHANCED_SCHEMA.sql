-- Enhanced Farmer Community Chat Schema with Likes/Reactions
-- Real-time chat system for farmers with voice messaging and reactions support

-- Users table (simplified for farmer community)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (matches your requirements)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'audio')),
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_url TEXT,
  audio_duration INTEGER, -- duration in seconds
  
  -- Constraints
  CONSTRAINT content_or_audio_required 
    CHECK (
      (type = 'text' AND content IS NOT NULL AND content != '') OR
      (type = 'audio' AND audio_url IS NOT NULL)
    )
);

-- Message likes table
CREATE TABLE IF NOT EXISTS message_likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate likes
  UNIQUE(message_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_id ON message_likes(user_id);

-- RLS Policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

-- RLS Policies for messages table
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (true);

-- RLS Policies for message_likes table
CREATE POLICY "Anyone can view message likes" ON message_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert likes" ON message_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own likes" ON message_likes FOR DELETE USING (true);

-- Function to update likes count when a like is added/removed
CREATE OR REPLACE FUNCTION update_message_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE messages SET likes = likes + 1 WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE messages SET likes = likes - 1 WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update likes count
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON message_likes;
CREATE TRIGGER trigger_update_likes_on_insert
  AFTER INSERT ON message_likes
  FOR EACH ROW EXECUTE FUNCTION update_message_likes_count();

DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON message_likes;
CREATE TRIGGER trigger_update_likes_on_delete
  AFTER DELETE ON message_likes
  FOR EACH ROW EXECUTE FUNCTION update_message_likes_count();

-- Storage bucket for chat audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true) ON CONFLICT DO NOTHING;

-- Storage policies for chat-files bucket
CREATE POLICY "Anyone can view chat files" ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files');
CREATE POLICY "Users can delete their own chat files" ON storage.objects FOR DELETE USING (bucket_id = 'chat-files');

-- Sample users (for testing - remove in production)
INSERT INTO users (id, name, email, avatar) VALUES 
  ('user1', 'राज पटेल', 'raj@example.com', null),
  ('user2', 'सुनीता शर्मा', 'sunita@example.com', null),
  ('user3', 'अमित गुप्ता', 'amit@example.com', null)
ON CONFLICT (id) DO NOTHING;

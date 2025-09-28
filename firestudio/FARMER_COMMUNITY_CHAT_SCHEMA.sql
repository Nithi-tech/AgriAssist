-- Farmer Community Chat Schema
-- Real-time chat system for farmers with voice messaging support

-- Farmer profiles table (extends existing auth_users or creates new)
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community messages table
CREATE TABLE IF NOT EXISTS farmer_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  content TEXT,
  voice_url TEXT,
  voice_duration INTEGER, -- duration in seconds
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  reply_to UUID REFERENCES farmer_community_messages(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT content_or_voice_required 
    CHECK (
      (message_type = 'text' AND content IS NOT NULL AND content != '') OR
      (message_type = 'voice' AND voice_url IS NOT NULL AND voice_duration > 0)
    )
);

-- Message reactions table (for likes, etc.)
CREATE TABLE IF NOT EXISTS farmer_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES farmer_community_messages(id) ON DELETE CASCADE,
  farmer_id TEXT NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate reactions
  UNIQUE(message_id, farmer_id, reaction_type)
);

-- Online status tracking table (for real-time presence)
CREATE TABLE IF NOT EXISTS farmer_online_status (
  farmer_id TEXT PRIMARY KEY REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing indicators table (temporary data, can be cleaned periodically)
CREATE TABLE IF NOT EXISTS farmer_typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds'),
  
  -- Unique constraint per farmer
  UNIQUE(farmer_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmer_community_messages_timestamp ON farmer_community_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_farmer_community_messages_farmer_id ON farmer_community_messages(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_community_messages_type ON farmer_community_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_farmer_community_messages_reply_to ON farmer_community_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_farmer_message_reactions_message_id ON farmer_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_status ON farmer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_farmer_online_status_is_online ON farmer_online_status(is_online);
CREATE INDEX IF NOT EXISTS idx_farmer_typing_status_expires ON farmer_typing_status(expires_at);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_farmer_profiles_updated_at 
  BEFORE UPDATE ON farmer_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_community_messages_updated_at 
  BEFORE UPDATE ON farmer_community_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_online_status_updated_at 
  BEFORE UPDATE ON farmer_online_status 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired typing status function
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void AS $$
BEGIN
    DELETE FROM farmer_typing_status WHERE expires_at < NOW();
END;
$$ LANGUAGE 'plpgsql';

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_online_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_typing_status ENABLE ROW LEVEL SECURITY;

-- Farmer profiles policies
CREATE POLICY "Farmers can view all profiles" ON farmer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Farmers can update their own profile" ON farmer_profiles
  FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "Farmers can insert their own profile" ON farmer_profiles
  FOR INSERT WITH CHECK (id = auth.uid()::text);

-- Community messages policies
CREATE POLICY "Farmers can view all messages" ON farmer_community_messages
  FOR SELECT USING (true);

CREATE POLICY "Farmers can insert their own messages" ON farmer_community_messages
  FOR INSERT WITH CHECK (farmer_id = auth.uid()::text);

CREATE POLICY "Farmers can update their own messages" ON farmer_community_messages
  FOR UPDATE USING (farmer_id = auth.uid()::text);

CREATE POLICY "Farmers can delete their own messages" ON farmer_community_messages
  FOR DELETE USING (farmer_id = auth.uid()::text);

-- Message reactions policies
CREATE POLICY "Farmers can view all reactions" ON farmer_message_reactions
  FOR SELECT USING (true);

CREATE POLICY "Farmers can manage their own reactions" ON farmer_message_reactions
  FOR ALL USING (farmer_id = auth.uid()::text);

-- Online status policies
CREATE POLICY "Farmers can view all online status" ON farmer_online_status
  FOR SELECT USING (true);

CREATE POLICY "Farmers can update their own status" ON farmer_online_status
  FOR ALL USING (farmer_id = auth.uid()::text);

-- Typing status policies
CREATE POLICY "Farmers can view all typing status" ON farmer_typing_status
  FOR SELECT USING (true);

CREATE POLICY "Farmers can manage their own typing status" ON farmer_typing_status
  FOR ALL USING (farmer_id = auth.uid()::text);

-- Storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('farmer-voice-messages', 'farmer-voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages
CREATE POLICY "Farmers can upload voice messages" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'farmer-voice-messages' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view voice messages" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'farmer-voice-messages');

CREATE POLICY "Farmers can delete their own voice messages" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'farmer-voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sample data (optional, for testing)
-- Insert sample farmer profiles
INSERT INTO farmer_profiles (id, name, mobile_number, status) VALUES
  ('F001', 'राज पटेल', '+919876543210', 'online'),
  ('F002', 'सुमित्रा देवी', '+919876543211', 'online'),
  ('F003', 'अमित शर्मा', '+919876543212', 'away'),
  ('F004', 'प्रिया गुप्ता', '+919876543213', 'online'),
  ('F005', 'रवि कुमार', '+919876543214', 'offline')
ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO farmer_community_messages (farmer_id, content, message_type, timestamp) VALUES
  ('F002', 'नमस्ते सभी! आज मेरी फसल में कुछ समस्या है। क्या कोई सलाह दे सकता है?', 'text', NOW() - INTERVAL '5 minutes'),
  ('F003', 'क्या समस्या है बहनजी? फोटो भेज सकती हैं?', 'text', NOW() - INTERVAL '4 minutes'),
  ('F001', 'मैं कल वही समस्या का सामना कर रहा था। आप कीटनाशक का इस्तेमाल कर सकती हैं।', 'text', NOW() - INTERVAL '3 minutes'),
  ('F004', 'धन्यवाद सभी। मैं कल दुकान से कीटनाशक लेकर आऊंगी।', 'text', NOW() - INTERVAL '1 minute')
ON CONFLICT (id) DO NOTHING;

-- Create a view for messages with farmer details
CREATE OR REPLACE VIEW farmer_community_messages_with_profiles AS
SELECT 
  m.*,
  p.name as farmer_name,
  p.avatar_url as farmer_avatar,
  p.status as farmer_status,
  COALESCE(r.reaction_count, 0) as reaction_count
FROM farmer_community_messages m
LEFT JOIN farmer_profiles p ON m.farmer_id = p.id
LEFT JOIN (
  SELECT 
    message_id, 
    COUNT(*) as reaction_count
  FROM farmer_message_reactions 
  GROUP BY message_id
) r ON m.id = r.message_id
ORDER BY m.timestamp DESC;

-- Function to get chat statistics
CREATE OR REPLACE FUNCTION get_farmer_community_stats()
RETURNS TABLE(
  total_farmers INTEGER,
  online_farmers INTEGER,
  total_messages INTEGER,
  messages_today INTEGER,
  voice_messages INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM farmer_profiles),
    (SELECT COUNT(*)::INTEGER FROM farmer_profiles WHERE status = 'online'),
    (SELECT COUNT(*)::INTEGER FROM farmer_community_messages),
    (SELECT COUNT(*)::INTEGER FROM farmer_community_messages WHERE timestamp >= CURRENT_DATE),
    (SELECT COUNT(*)::INTEGER FROM farmer_community_messages WHERE message_type = 'voice');
END;
$$ LANGUAGE plpgsql;

-- Notification trigger for new messages (optional, for push notifications)
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_farmer_message', 
    json_build_object(
      'message_id', NEW.id,
      'farmer_id', NEW.farmer_id,
      'type', NEW.message_type,
      'timestamp', NEW.timestamp
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farmer_message_notify 
  AFTER INSERT ON farmer_community_messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

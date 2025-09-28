# Farmer Community Backend Setup Guide

## Option 1: Supabase Real-time (Recommended)

The Farmer Community chat is designed to work with Supabase's built-in real-time functionality. This is the simplest approach as it uses your existing Supabase setup.

### Setup Steps:

1. **Enable Realtime on Supabase**
   ```sql
   -- Run this in your Supabase SQL editor
   alter publication supabase_realtime add table farmer_community_messages;
   alter publication supabase_realtime add table farmer_profiles;
   alter publication supabase_realtime add table farmer_online_status;
   ```

2. **Run the Database Schema**
   ```bash
   # Execute the schema file in your Supabase SQL editor
   cat FARMER_COMMUNITY_CHAT_SCHEMA.sql
   ```

3. **Environment Variables**
   ```env
   # Add to your .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Option 2: Socket.IO with Node.js Backend

If you prefer a custom Socket.IO implementation for more control:

### Backend Server (Node.js + Socket.IO)

1. **Create Backend Directory**
   ```bash
   mkdir farmer-chat-backend
   cd farmer-chat-backend
   npm init -y
   ```

2. **Install Dependencies**
   ```bash
   npm install express socket.io cors multer @supabase/supabase-js dotenv
   npm install -D @types/node @types/express typescript ts-node nodemon
   ```

3. **Create Server (server.ts)**
   ```typescript
   import express from 'express';
   import { createServer } from 'http';
   import { Server } from 'socket.io';
   import cors from 'cors';
   import multer from 'multer';
   import { createClient } from '@supabase/supabase-js';
   import dotenv from 'dotenv';

   dotenv.config();

   const app = express();
   const httpServer = createServer(app);
   const io = new Server(httpServer, {
     cors: {
       origin: process.env.FRONTEND_URL || "http://localhost:3000",
       methods: ["GET", "POST"]
     }
   });

   // Supabase client
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );

   // Middleware
   app.use(cors());
   app.use(express.json());

   // File upload setup for voice messages
   const upload = multer({
     dest: 'uploads/voice-messages/',
     limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
   });

   // Store connected farmers
   const connectedFarmers = new Map<string, {
     farmerId: string;
     farmerName: string;
     socketId: string;
     joinedAt: Date;
   }>();

   // Store typing status
   const typingFarmers = new Map<string, {
     farmerId: string;
     farmerName: string;
     timestamp: Date;
   }>();

   // Socket.IO connection handling
   io.on('connection', (socket) => {
     console.log('Farmer connected:', socket.id);

     // Farmer joins the community chat
     socket.on('join-community', async (data: { 
       farmerId: string; 
       farmerName: string; 
     }) => {
       const { farmerId, farmerName } = data;
       
       // Add to connected farmers
       connectedFarmers.set(socket.id, {
         farmerId,
         farmerName,
         socketId: socket.id,
         joinedAt: new Date()
       });

       // Join the main community room
       socket.join('farmer-community');

       // Update farmer status in database
       await supabase
         .from('farmer_profiles')
         .upsert({
           id: farmerId,
           name: farmerName,
           status: 'online',
           last_seen: new Date().toISOString()
         });

       // Broadcast farmer joined
       socket.to('farmer-community').emit('farmer-joined', {
         farmerId,
         farmerName,
         timestamp: new Date().toISOString()
       });

       // Send list of online farmers
       const onlineFarmers = Array.from(connectedFarmers.values());
       io.to('farmer-community').emit('online-farmers-updated', onlineFarmers);
     });

     // Handle new text messages
     socket.on('send-message', async (data: {
       farmerId: string;
       content: string;
       replyTo?: string;
     }) => {
       try {
         const { farmerId, content, replyTo } = data;
         
         // Save message to database
         const { data: message, error } = await supabase
           .from('farmer_community_messages')
           .insert([{
             farmer_id: farmerId,
             content,
             message_type: 'text',
             reply_to: replyTo,
             timestamp: new Date().toISOString()
           }])
           .select(`
             *,
             farmer_profiles!farmer_id (
               id, name, mobile_number, status
             )
           `)
           .single();

         if (error) {
           console.error('Error saving message:', error);
           socket.emit('message-error', { error: 'Failed to save message' });
           return;
         }

         // Broadcast message to all farmers in community
         io.to('farmer-community').emit('new-message', message);

       } catch (error) {
         console.error('Error handling message:', error);
         socket.emit('message-error', { error: 'Server error' });
       }
     });

     // Handle voice messages
     socket.on('send-voice-message', async (data: {
       farmerId: string;
       audioBlob: Buffer;
       duration: number;
       replyTo?: string;
     }) => {
       try {
         const { farmerId, audioBlob, duration, replyTo } = data;
         
         // Upload to Supabase Storage
         const fileName = `voice_${farmerId}_${Date.now()}.webm`;
         const { data: uploadData, error: uploadError } = await supabase.storage
           .from('farmer-voice-messages')
           .upload(fileName, audioBlob, {
             contentType: 'audio/webm',
             upsert: false
           });

         if (uploadError) {
           socket.emit('voice-message-error', { error: 'Failed to upload voice message' });
           return;
         }

         // Get public URL
         const { data: urlData } = supabase.storage
           .from('farmer-voice-messages')
           .getPublicUrl(fileName);

         // Save voice message to database
         const { data: message, error } = await supabase
           .from('farmer_community_messages')
           .insert([{
             farmer_id: farmerId,
             voice_url: urlData.publicUrl,
             voice_duration: duration,
             message_type: 'voice',
             reply_to: replyTo,
             timestamp: new Date().toISOString()
           }])
           .select(`
             *,
             farmer_profiles!farmer_id (
               id, name, mobile_number, status
             )
           `)
           .single();

         if (error) {
           console.error('Error saving voice message:', error);
           socket.emit('voice-message-error', { error: 'Failed to save voice message' });
           return;
         }

         // Broadcast voice message to all farmers
         io.to('farmer-community').emit('new-voice-message', message);

       } catch (error) {
         console.error('Error handling voice message:', error);
         socket.emit('voice-message-error', { error: 'Server error' });
       }
     });

     // Handle typing indicators
     socket.on('typing-start', (data: { farmerId: string; farmerName: string }) => {
       const { farmerId, farmerName } = data;
       
       typingFarmers.set(farmerId, {
         farmerId,
         farmerName,
         timestamp: new Date()
       });

       socket.to('farmer-community').emit('farmer-typing', {
         farmerId,
         farmerName,
         isTyping: true
       });
     });

     socket.on('typing-stop', (data: { farmerId: string }) => {
       const { farmerId } = data;
       
       if (typingFarmers.has(farmerId)) {
         typingFarmers.delete(farmerId);
         socket.to('farmer-community').emit('farmer-typing', {
           farmerId,
           isTyping: false
         });
       }
     });

     // Handle disconnection
     socket.on('disconnect', async () => {
       console.log('Farmer disconnected:', socket.id);
       
       const farmerData = connectedFarmers.get(socket.id);
       if (farmerData) {
         const { farmerId, farmerName } = farmerData;
         
         // Remove from connected farmers
         connectedFarmers.delete(socket.id);
         
         // Update status in database
         await supabase
           .from('farmer_profiles')
           .update({
             status: 'offline',
             last_seen: new Date().toISOString()
           })
           .eq('id', farmerId);

         // Remove from typing if typing
         if (typingFarmers.has(farmerId)) {
           typingFarmers.delete(farmerId);
         }

         // Broadcast farmer left
         socket.to('farmer-community').emit('farmer-left', {
           farmerId,
           farmerName,
           timestamp: new Date().toISOString()
         });

         // Update online farmers list
         const onlineFarmers = Array.from(connectedFarmers.values());
         io.to('farmer-community').emit('online-farmers-updated', onlineFarmers);
       }
     });
   });

   // REST API endpoints
   app.get('/api/health', (req, res) => {
     res.json({ status: 'OK', timestamp: new Date().toISOString() });
   });

   app.get('/api/community/messages', async (req, res) => {
     try {
       const limit = parseInt(req.query.limit as string) || 50;
       const offset = parseInt(req.query.offset as string) || 0;

       const { data: messages, error } = await supabase
         .from('farmer_community_messages')
         .select(`
           *,
           farmer_profiles!farmer_id (
             id, name, mobile_number, status
           )
         `)
         .order('timestamp', { ascending: false })
         .range(offset, offset + limit - 1);

       if (error) {
         return res.status(500).json({ error: error.message });
       }

       res.json({ messages: messages?.reverse() || [] });
     } catch (error) {
       res.status(500).json({ error: 'Server error' });
     }
   });

   // Start server
   const PORT = process.env.PORT || 3001;
   httpServer.listen(PORT, () => {
     console.log(`Farmer Community Backend running on port ${PORT}`);
   });

   // Clean up typing status periodically
   setInterval(() => {
     const now = new Date();
     for (const [farmerId, data] of typingFarmers.entries()) {
       if (now.getTime() - data.timestamp.getTime() > 10000) { // 10 seconds
         typingFarmers.delete(farmerId);
         io.to('farmer-community').emit('farmer-typing', {
           farmerId,
           isTyping: false
         });
       }
     }
   }, 5000);
   ```

4. **Package.json Scripts**
   ```json
   {
     "scripts": {
       "dev": "nodemon --exec ts-node server.ts",
       "build": "tsc",
       "start": "node dist/server.js"
     }
   }
   ```

5. **Environment Variables (.env)**
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Frontend Integration for Socket.IO

If using Socket.IO backend, update the farmer community service:

```typescript
// src/lib/socket-community-service.ts
import { io, Socket } from 'socket.io-client';

export class SocketCommunityService {
  private socket: Socket | null = null;
  private farmerId: string | null = null;

  connect(farmerId: string, farmerName: string) {
    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    this.farmerId = farmerId;

    this.socket.emit('join-community', { farmerId, farmerName });

    // Listen for events
    this.socket.on('new-message', (message) => {
      // Handle new message
    });

    this.socket.on('new-voice-message', (message) => {
      // Handle new voice message
    });

    this.socket.on('farmer-typing', (data) => {
      // Handle typing indicators
    });

    return true;
  }

  sendMessage(content: string, replyTo?: string) {
    if (this.socket && this.farmerId) {
      this.socket.emit('send-message', {
        farmerId: this.farmerId,
        content,
        replyTo
      });
    }
  }

  sendVoiceMessage(audioBlob: Blob, duration: number, replyTo?: string) {
    if (this.socket && this.farmerId) {
      const reader = new FileReader();
      reader.onload = () => {
        this.socket!.emit('send-voice-message', {
          farmerId: this.farmerId,
          audioBlob: reader.result,
          duration,
          replyTo
        });
      };
      reader.readAsArrayBuffer(audioBlob);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.farmerId = null;
    }
  }
}
```

## Production Deployment

### For Supabase (Option 1):
1. Deploy your Next.js app to Vercel, Netlify, or similar
2. Configure environment variables
3. Ensure Supabase real-time is enabled

### For Socket.IO Backend (Option 2):
1. Deploy backend to Railway, Heroku, or DigitalOcean
2. Deploy frontend to Vercel/Netlify
3. Update CORS and environment variables
4. Consider using Redis for scaling Socket.IO across multiple servers

## Voice Message Storage

Both options use Supabase Storage for voice messages:

1. **Create Storage Bucket**
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('farmer-voice-messages', 'farmer-voice-messages', true);
   ```

2. **Set Storage Policies** (already in schema)

3. **Configure CORS** (if needed):
   ```json
   [
     {
       "allowedOrigins": ["https://yourdomain.com"],
       "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "allowedHeaders": ["*"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

## Testing

1. **Test Real-time Messages**
   - Open multiple browser tabs
   - Send messages from different "farmers"
   - Verify real-time delivery

2. **Test Voice Messages**
   - Record voice messages
   - Verify upload and playback
   - Test on different devices

3. **Test Connection Stability**
   - Test with poor network conditions
   - Verify reconnection handling
   - Test offline/online scenarios

## Monitoring

- Monitor Supabase dashboard for real-time connections
- Set up error tracking (Sentry, LogRocket)
- Monitor voice message storage usage
- Track user engagement and message volume

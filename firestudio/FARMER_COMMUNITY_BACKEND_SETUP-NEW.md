# 🌾 Farmer Community Backend Setup Guide

This comprehensive guide covers setting up the backend for the Farmer Community chat system with **Supabase** (recommended) and **Socket.IO** (alternative) options.

## 📋 Table of Contents
- [Option 1: Supabase Setup (Recommended)](#option-1-supabase-setup-recommended)
- [Option 2: Socket.IO + Node.js Setup (Alternative)](#option-2-socketio--nodejs-setup-alternative)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Testing the Setup](#testing-the-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Option 1: Supabase Setup (Recommended)

### Why Supabase?
- ✅ **Real-time subscriptions** out of the box
- ✅ **Built-in authentication** and RLS security
- ✅ **File storage** for voice messages
- ✅ **Auto-scaling** and managed infrastructure
- ✅ **PostgreSQL** with advanced features
- ✅ **No server management** required

### Step 1: Create Supabase Project

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create a new project**:
   ```
   Project Name: farmer-community-chat
   Database Password: [Generate a strong password]
   Region: [Choose closest to your users]
   ```
3. **Wait for project setup** (2-3 minutes)

### Step 2: Get Project Credentials

Navigate to **Settings → API** and copy:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Step 3: Database Setup

1. **Navigate to SQL Editor** in Supabase Dashboard
2. **Run the schema file**:
   ```sql
   -- Copy and paste the entire FARMER_COMMUNITY_CHAT_SCHEMA-NEW.sql file
   -- This will create all tables, policies, functions, and sample data
   ```
3. **Verify tables** in the Table Editor:
   - ✅ `farmer_profiles`
   - ✅ `farmer_community_messages`
   - ✅ `farmer_typing_indicators`
   - ✅ `farmer_message_reactions`

### Step 4: Storage Bucket Setup

1. **Navigate to Storage** in Supabase Dashboard
2. **Verify bucket creation**:
   - Bucket name: `voice-messages`
   - Public access: ✅ Enabled
   - File size limit: 5MB
   - Allowed MIME types: `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`

### Step 5: Real-time Configuration

1. **Navigate to Database → Replication**
2. **Enable real-time** for these tables:
   ```
   ✅ farmer_profiles
   ✅ farmer_community_messages
   ✅ farmer_typing_indicators
   ✅ farmer_message_reactions
   ```

### Step 6: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 7: Configure Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 🔧 Option 2: Socket.IO + Node.js Setup (Alternative)

### When to use Socket.IO?
- 🔹 Need custom real-time logic
- 🔹 Integration with existing Node.js backend
- 🔹 Custom authentication system
- 🔹 Advanced message processing requirements

### Step 1: Create Node.js Server

Create `server/index.js`:

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Voice message upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/voice-messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files allowed.'));
    }
  }
});

// In-memory storage (replace with database in production)
const farmers = new Map();
const messages = [];
const typingUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Handle farmer join
  socket.on('farmer:join', (farmerId) => {
    farmers.set(socket.id, {
      id: socket.id,
      farmerId,
      displayName: `Farmer ${farmerId}`,
      isOnline: true,
      lastSeen: new Date(),
      socketId: socket.id
    });

    socket.join('farmer-community');
    
    // Broadcast online status
    socket.to('farmer-community').emit('farmer:online', {
      farmerId,
      displayName: `Farmer ${farmerId}`,
      socketId: socket.id
    });

    // Send recent messages
    socket.emit('messages:history', messages.slice(-50));
    
    // Send online farmers
    const onlineFarmers = Array.from(farmers.values());
    socket.emit('farmers:online', onlineFarmers);

    console.log(`🌾 Farmer ${farmerId} joined the community`);
  });

  // Handle text messages
  socket.on('message:text', (data) => {
    const farmer = farmers.get(socket.id);
    if (!farmer) return;

    const message = {
      id: Date.now().toString(),
      farmerId: farmer.farmerId,
      displayName: farmer.displayName,
      content: data.content,
      type: 'text',
      timestamp: new Date(),
      replyTo: data.replyTo || null
    };

    messages.push(message);
    io.to('farmer-community').emit('message:new', message);

    console.log(`💬 Text message from ${farmer.farmerId}: ${data.content}`);
  });

  // Handle voice messages
  socket.on('message:voice', (data) => {
    const farmer = farmers.get(socket.id);
    if (!farmer) return;

    const message = {
      id: Date.now().toString(),
      farmerId: farmer.farmerId,
      displayName: farmer.displayName,
      type: 'voice',
      voiceUrl: data.voiceUrl,
      duration: data.duration,
      timestamp: new Date(),
      replyTo: data.replyTo || null
    };

    messages.push(message);
    io.to('farmer-community').emit('message:new', message);

    console.log(`🎤 Voice message from ${farmer.farmerId} (${data.duration}s)`);
  });

  // Handle typing indicators
  socket.on('typing:start', () => {
    const farmer = farmers.get(socket.id);
    if (!farmer) return;

    typingUsers.set(socket.id, {
      farmerId: farmer.farmerId,
      displayName: farmer.displayName,
      timestamp: Date.now()
    });

    socket.to('farmer-community').emit('typing:start', {
      farmerId: farmer.farmerId,
      displayName: farmer.displayName
    });

    // Auto-clear typing after 3 seconds
    setTimeout(() => {
      if (typingUsers.has(socket.id)) {
        typingUsers.delete(socket.id);
        socket.to('farmer-community').emit('typing:stop', {
          farmerId: farmer.farmerId
        });
      }
    }, 3000);
  });

  socket.on('typing:stop', () => {
    const farmer = farmers.get(socket.id);
    if (!farmer) return;

    typingUsers.delete(socket.id);
    socket.to('farmer-community').emit('typing:stop', {
      farmerId: farmer.farmerId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const farmer = farmers.get(socket.id);
    if (farmer) {
      // Broadcast offline status
      socket.to('farmer-community').emit('farmer:offline', {
        farmerId: farmer.farmerId
      });

      farmers.delete(socket.id);
      typingUsers.delete(socket.id);

      console.log(`👋 Farmer ${farmer.farmerId} disconnected`);
    }
  });
});

// REST API endpoints
app.post('/api/upload-voice', upload.single('voice'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No voice file uploaded' });
  }

  const voiceUrl = `${req.protocol}://${req.get('host')}/uploads/voice-messages/${req.file.filename}`;
  
  res.json({
    success: true,
    voiceUrl,
    filename: req.file.filename
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    connections: farmers.size,
    messages: messages.length
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Farmer Community Server running on port ${PORT}`);
});
```

### Step 2: Install Socket.IO Dependencies

```bash
# Server dependencies
npm init -y
npm install express socket.io cors multer
npm install -D nodemon

# Client dependencies (in your Next.js project)
npm install socket.io-client
```

### Step 3: Create Socket.IO Client Service

Create `src/lib/socket-service.ts`:

```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

  connect(farmerId: string) {
    this.socket = io(this.serverUrl);
    
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.socket?.emit('farmer:join', farmerId);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendTextMessage(content: string, replyTo?: string) {
    this.socket?.emit('message:text', { content, replyTo });
  }

  sendVoiceMessage(voiceUrl: string, duration: number, replyTo?: string) {
    this.socket?.emit('message:voice', { voiceUrl, duration, replyTo });
  }

  startTyping() {
    this.socket?.emit('typing:start');
  }

  stopTyping() {
    this.socket?.emit('typing:stop');
  }
}

export const socketService = new SocketService();
```

---

## 🔐 Environment Configuration

Create `.env.local` file:

```env
# Choose your backend option:

# Option 1: Supabase (Recommended)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Option 2: Socket.IO (Alternative)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🗄️ Database Migration

### For Supabase:
1. Copy the entire `FARMER_COMMUNITY_CHAT_SCHEMA-NEW.sql`
2. Paste in Supabase SQL Editor
3. Run the script
4. Verify tables and data in Table Editor

### For Socket.IO:
Replace in-memory storage with a proper database:

```javascript
// Example with PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Replace in-memory arrays with database queries
```

---

## 🧪 Testing the Setup

### Test Supabase Connection:

Create `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select('*')
      .limit(5);

    if (error) throw error;
    
    console.log('✅ Database connection successful');
    console.log('Sample farmers:', data);

    // Test real-time connection
    const channel = supabase
      .channel('test')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'farmer_profiles' },
        payload => console.log('Real-time event:', payload)
      )
      .subscribe();

    console.log('✅ Real-time connection established');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

### Test Socket.IO Connection:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Socket.IO connection successful');
  socket.emit('farmer:join', 'F001');
});

socket.on('message:new', (message) => {
  console.log('📨 Received message:', message);
});

socket.emit('message:text', { content: 'Test message from backend setup!' });
```

---

## 🚀 Production Deployment

### Supabase Production:

1. **Upgrade to Pro plan** for production features
2. **Configure custom domain** (optional)
3. **Set up database backups**
4. **Configure monitoring** and alerts
5. **Review RLS policies** for security
6. **Enable database extensions** as needed

### Socket.IO Production:

1. **Deploy to cloud platform**:
   ```bash
   # Example for Heroku
   heroku create farmer-community-backend
   heroku addons:create heroku-postgresql:hobby-dev
   git push heroku main
   ```

2. **Environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_URL=postgresql://...
   ```

3. **Process management**:
   ```json
   // package.json
   {
     "scripts": {
       "start": "node index.js",
       "dev": "nodemon index.js"
     }
   }
   ```

4. **Load balancing** for multiple servers:
   ```javascript
   const RedisAdapter = require('@socket.io/redis-adapter');
   const redis = require('redis');
   
   const pubClient = redis.createClient({ url: process.env.REDIS_URL });
   const subClient = pubClient.duplicate();
   
   io.adapter(RedisAdapter(pubClient, subClient));
   ```

---

## 🛠️ Troubleshooting

### Common Supabase Issues:

| Issue | Solution |
|-------|----------|
| **RLS blocks queries** | Check RLS policies, use service role key for admin operations |
| **Real-time not working** | Enable replication for tables, check subscription status |
| **Storage upload fails** | Verify bucket policies, check file size/type limits |
| **Connection timeout** | Check network, verify project URL and keys |

### Common Socket.IO Issues:

| Issue | Solution |
|-------|----------|
| **CORS errors** | Configure CORS properly in server setup |
| **Connection drops** | Implement reconnection logic, check network stability |
| **File upload fails** | Check multer configuration, disk space, permissions |
| **Memory issues** | Replace in-memory storage with database |

### Debug Commands:

```bash
# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" "https://your-project.supabase.co/rest/v1/farmer_profiles"

# Check Socket.IO server
curl http://localhost:5000/api/health

# Test voice upload
curl -X POST -F "voice=@test-audio.webm" http://localhost:5000/api/upload-voice
```

---

## 📊 Monitoring & Analytics

### Supabase Monitoring:
- Use built-in **Dashboard metrics**
- Set up **Database alerts**
- Monitor **API usage** and **Storage usage**
- Check **Real-time connections**

### Socket.IO Monitoring:
```javascript
// Add to server
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', err);
});

// Track metrics
setInterval(() => {
  console.log(`📊 Active connections: ${farmers.size}`);
  console.log(`💬 Total messages: ${messages.length}`);
}, 30000);
```

---

## ✅ Setup Verification Checklist

### Supabase Setup:
- [ ] Project created and configured
- [ ] Database schema applied successfully
- [ ] Storage bucket created with proper policies
- [ ] Real-time enabled for all tables
- [ ] Environment variables configured
- [ ] Test connection successful

### Socket.IO Setup:
- [ ] Node.js server running
- [ ] Socket.IO client connected
- [ ] Voice upload endpoint working
- [ ] Real-time messaging functional
- [ ] Environment variables configured
- [ ] Production deployment ready

---

## 🎯 Next Steps

1. **Integrate with your frontend** components
2. **Test the complete flow** end-to-end
3. **Add authentication** integration
4. **Configure monitoring** and alerts
5. **Plan for scaling** and load testing
6. **Set up backup** and recovery procedures

---

## 💡 Pro Tips

- **Use Supabase** for faster development and built-in features
- **Test real-time** connections thoroughly before production
- **Monitor performance** and optimize queries
- **Implement proper error handling** for network issues
- **Cache frequently accessed data** to reduce API calls
- **Use TypeScript** for better type safety across the stack

---

**🌾 Your Farmer Community backend is now ready!** Choose Supabase for simplicity or Socket.IO for custom requirements. Both options provide reliable real-time chat with voice messaging capabilities.

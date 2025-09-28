// ============================================================================
// AGRIASSIST MARKET PRICES BACKEND SERVER
// JSON-based storage with weekly refresh schedule
// ============================================================================

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const moment = require('moment-timezone');

// Import services
const MarketPricesScraper = require('./services/scraper');
const cache = require('./utils/cache');
const pricesRouter = require('./routes/prices');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize scraper
const scraper = new MarketPricesScraper();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:9005', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST');
  console.log(`📡 ${timestamp} - ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AgriAssist Market Prices Backend',
    timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST'),
    uptime: process.uptime(),
    cache_stats: cache.getStats()
  });
});

// Market prices API routes
app.use('/api/prices', pricesRouter);

// Cache management
app.get('/api/cache/stats', (req, res) => {
  res.json({
    success: true,
    data: cache.getStats()
  });
});

app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Serve static files from data directory (for debugging)
app.get('/api/data/raw', async (req, res) => {
  try {
    const data = await scraper.loadMarketPrices();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load raw data',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /api/prices',
      'GET /api/prices/latest',
      'GET /api/prices/trends?commodity=Rice&state=Tamil Nadu',
      'GET /api/prices/stats',
      'POST /api/prices/sync',
      'GET /api/cache/stats',
      'POST /api/cache/clear'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Server Error:', error.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// ============================================================================
// SCHEDULED TASKS - Weekly Refresh (Sunday 12:05 AM IST)
// ============================================================================

// Schedule data refresh every Sunday at 12:05 AM IST
cron.schedule('5 0 * * 0', async () => {
  const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST');
  console.log(`⏰ Weekly refresh triggered: ${timestamp}`);
  
  try {
    // Clear cache before refresh
    cache.clear();
    
    // Run scraper
    const result = await scraper.scrapeMarketPrices();
    
    if (result.success) {
      console.log(`✅ Weekly refresh completed: ${result.records} records`);
    } else {
      console.error(`❌ Weekly refresh failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Weekly refresh error:', error.message);
  }
}, {
  timezone: 'Asia/Kolkata'
});

// Manual trigger for testing (every minute, disabled in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Manual refresh available every 5 minutes');
  
  // For testing, allow refresh every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔧 DEV: 5-minute refresh check...');
    // Uncomment below to enable frequent testing refreshes
    // const result = await scraper.scrapeMarketPrices();
    // console.log('🔧 DEV refresh result:', result);
  });
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    console.log('🚀 Starting AgriAssist Market Prices Backend...');
    
    // Initial data load
    console.log('📂 Loading initial market data...');
    const initialData = await scraper.loadMarketPrices();
    console.log(`📊 Loaded ${initialData.total_records} records`);
    
    // Start server
    app.listen(PORT, () => {
      const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST');
      console.log('\n🎉 Market Prices Backend is running!');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🕐 Started: ${timestamp}`);
      console.log(`📅 Next scheduled refresh: Next Sunday 12:05 AM IST`);
      console.log('\n📋 Available endpoints:');
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/prices`);
      console.log(`   GET  http://localhost:${PORT}/api/prices/latest`);
      console.log(`   GET  http://localhost:${PORT}/api/prices/trends?commodity=Rice`);
      console.log(`   POST http://localhost:${PORT}/api/prices/sync`);
      console.log(`   GET  http://localhost:${PORT}/api/cache/stats`);
      console.log('\n⚠️  Data refreshes only on Sundays at 12:05 AM IST');
      console.log('📝 Use POST /api/prices/sync for manual refresh\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Market Prices Backend...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Market Prices Backend...');
  process.exit(0);
});

// Start the server
startServer();

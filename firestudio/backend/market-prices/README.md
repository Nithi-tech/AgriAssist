# 🌾 AgriAssist Market Prices Dashboard

## 📋 Overview

A complete Market Prices Dashboard for AgriAssist with **JSON-based storage** and **weekly refresh** functionality. No database required - all data is stored in JSON files with intelligent caching.

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/market-prices/
├── server.js           # Main server with cron scheduling
├── routes/prices.js    # API endpoints
├── services/scraper.js # Data collection from APIs/scraping
├── utils/cache.js      # Memory cache utility
├── data/
│   ├── market_prices.json    # Main data file (updated weekly)
│   └── dummy_sample.json     # Fallback data
└── package.json
```

### Frontend (React + Tailwind)
```
src/components/MarketPrices.jsx  # Main dashboard component
src/app/(app)/market-prices-new/page.tsx  # Page wrapper
```

## ⏰ Refresh Schedule

- **Weekly Updates**: Every Sunday at 12:05 AM IST
- **Data Sources**: Agmarknet API → State APIs → Web Scraping → Mock Data
- **Caching**: 7-day memory cache with automatic expiration
- **Offline Support**: Always serves last saved JSON file

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
cd backend/market-prices
npm install
```

### 2. Start Backend Server
```bash
npm run dev
# Server runs on http://localhost:3001
```

### 3. Frontend is already integrated
The frontend component is already integrated into your Next.js app at `/market-prices-new`

## 📡 API Endpoints

### Main Endpoints
- `GET /api/prices` - All market prices with filters
- `GET /api/prices/latest` - Latest price per commodity/market
- `GET /api/prices/trends?commodity=Rice&state=Tamil Nadu` - Historical trends
- `GET /api/prices/stats` - Summary statistics
- `POST /api/prices/sync` - Manual refresh (force scrape)

### Utility Endpoints
- `GET /health` - Server health check
- `GET /api/cache/stats` - Cache statistics
- `POST /api/cache/clear` - Clear cache
- `GET /api/data/raw` - Raw JSON data

### Example Usage
```javascript
// Get all rice prices from Tamil Nadu
fetch('http://localhost:3001/api/prices?commodity=Rice&state=Tamil Nadu')

// Get price trends
fetch('http://localhost:3001/api/prices/trends?commodity=Wheat')

// Manual refresh
fetch('http://localhost:3001/api/prices/sync', { method: 'POST' })
```

## 🎯 Frontend Features

### Filters & Search
- ✅ State dropdown
- ✅ Commodity dropdown  
- ✅ Date range picker
- ✅ Search bar (commodity/market)
- ✅ Clear filters button

### Data Visualization
- ✅ Summary stats cards
- ✅ Price trend charts
- ✅ Top commodities bar chart
- ✅ Paginated data table
- ✅ Sortable columns

### Export & Offline
- ✅ CSV export
- ✅ Offline mode detection
- ✅ Cached data fallback
- ✅ Loading skeletons
- ✅ Error handling

### UI/UX
- ✅ Commodity category badges (Cereals, Vegetables, Fruits)
- ✅ Data source badges (API, Scraper, Mock)
- ✅ Online/offline indicator
- ✅ Responsive design
- ✅ Loading states

## 📊 Data Flow

### Weekly Refresh Cycle
```
Sunday 12:05 AM IST
    ↓
1. Clear memory cache
    ↓
2. Try Agmarknet API
    ↓
3. Try State Government APIs  
    ↓
4. Web scraping fallback
    ↓
5. Generate mock data (if all fail)
    ↓
6. Save to market_prices.json
    ↓
7. Update cache
```

### Request Handling
```
Frontend Request
    ↓
Check Memory Cache (30min TTL)
    ↓
If cache miss → Load from JSON file
    ↓
If JSON missing → Load dummy_sample.json
    ↓
Apply filters, pagination, sorting
    ↓
Return response
```

## 🔧 Configuration

### Backend Environment
```bash
# Optional - defaults provided
PORT=3001
NODE_ENV=development
```

### Cron Schedule Customization
```javascript
// In server.js - current: Sunday 12:05 AM IST
cron.schedule('5 0 * * 0', async () => {
  // Your refresh logic
}, { timezone: 'Asia/Kolkata' });
```

### Data Sources Configuration
```javascript
// In services/scraper.js
const apiUrls = [
  'https://api.data.gov.in/resource/...',
  'https://agmarknet.gov.in/...'
];

const stateAPIs = [
  { name: 'Tamil Nadu', url: '...', parser: 'tn' },
  { name: 'Karnataka', url: '...', parser: 'karnataka' }
];
```

## 📈 Monitoring & Debugging

### Health Check
```bash
curl http://localhost:3001/health
```

### Cache Statistics
```bash
curl http://localhost:3001/api/cache/stats
```

### Manual Data Refresh
```bash
curl -X POST http://localhost:3001/api/prices/sync
```

### View Raw Data
```bash
curl http://localhost:3001/api/data/raw
```

## 🔍 Data Schema

### Market Price Record
```json
{
  "id": "unique_identifier",
  "date": "2025-01-18",
  "state": "Tamil Nadu",
  "market": "Koyambedu",
  "commodity": "Rice",
  "min_price": 2800,
  "max_price": 3200,
  "modal_price": 3000,
  "source": "Agmarknet API",
  "scraped_at": "2025-01-18T12:05:00.000Z"
}
```

### JSON File Structure
```json
{
  "last_updated": "2025-01-18T12:05:00.000Z",
  "last_updated_ist": "2025-01-18 17:35:00 IST",
  "total_records": 150,
  "next_update": "2025-01-25 00:05:00 IST",
  "sources": ["Agmarknet API", "Mock Data"],
  "states": ["Tamil Nadu", "Karnataka", "..."],
  "commodities": ["Rice", "Wheat", "Tomato", "..."],
  "records": [...]
}
```

## 🚦 Status Indicators

### Data Sources Priority
1. **🟢 Agmarknet API** (Official government)
2. **🟡 State APIs** (Regional government)  
3. **🟠 Web Scraping** (Fallback)
4. **🔴 Mock Data** (Development/offline)

### Cache Status
- **🟢 Cache Hit** - Data served from memory (fast)
- **🟡 Cache Miss** - Data loaded from JSON (medium)
- **🔴 File Missing** - Dummy data loaded (slow)

## 🛠️ Troubleshooting

### Backend Not Starting
```bash
cd backend/market-prices
npm install
npm start
```

### No Data Showing
1. Check if backend is running: `http://localhost:3001/health`
2. Check data file: `http://localhost:3001/api/data/raw`
3. Force refresh: `curl -X POST http://localhost:3001/api/prices/sync`

### API Errors
1. Check CORS settings in `server.js`
2. Verify frontend API_BASE URL in `MarketPrices.jsx`
3. Check network connectivity

### Cache Issues
```bash
# Clear cache
curl -X POST http://localhost:3001/api/cache/clear

# Check cache stats  
curl http://localhost:3001/api/cache/stats
```

## 🔮 Future Enhancements

### Already Prepared For
- ✅ Farmer commodity subscriptions (localStorage)
- ✅ Price alerts (frontend notifications)
- ✅ Modular scraper (easy to add new states)
- ✅ Export to Excel, PDF
- ✅ Advanced charts (Chart.js integration ready)

### Easy Extensions
```javascript
// Add new state API
const newStateAPI = {
  name: 'Kerala',
  url: 'https://kerala.gov.in/api/prices',
  parser: 'kerala'
};
stateAPIs.push(newStateAPI);

// Add new commodity category
const spices = ['Turmeric', 'Cardamom', 'Pepper'];
// Update getCommodityCategory() function
```

## 📝 Technical Notes

### Why JSON Instead of Database?
- ✅ **Simplicity**: No database setup, connection management
- ✅ **Performance**: Direct file access, memory caching
- ✅ **Reliability**: Always works offline, no connection issues
- ✅ **Portability**: Easy to backup, transfer, version control
- ✅ **Cost**: No database hosting costs

### Weekly Refresh Logic
- Data freshness is not critical for agricultural prices
- Weekly updates reduce API load and costs
- Farmers check prices weekly for planning
- Caching prevents redundant API calls during the week

### Offline-First Design
- Works without internet connection
- Graceful degradation to cached data
- User-friendly error messages
- Progressive enhancement with online features

---

## 🎉 You're All Set!

Your Market Prices Dashboard is now ready with:
- ✅ JSON-based storage (no database)
- ✅ Weekly refresh automation
- ✅ Complete API backend
- ✅ React frontend with all features
- ✅ Offline support
- ✅ Export capabilities
- ✅ Caching system

**Backend**: http://localhost:3001
**Frontend**: http://localhost:9005/market-prices-new

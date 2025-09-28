# Market Prices System Configuration

## 🚀 Production-Ready Market Prices System
Complete agricultural market prices system with API integration, web scraping fallbacks, database storage, and data visualization dashboard.

## 📋 Environment Variables Required

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron Job Security
CRON_SECRET=your_secure_random_string_for_cron_authentication

# Next.js Application URL (for internal API calls)
NEXTJS_URL=http://localhost:3000  # Development
# NEXTJS_URL=https://your-domain.vercel.app  # Production
```

## 🗄️ Database Setup

1. **Create Supabase Project**: https://supabase.com
2. **Run SQL Schema**: Execute the SQL in `sql/market_prices_schema.sql`
3. **Set RLS Policies**: The schema includes Row Level Security policies
4. **Configure API Keys**: Add service role key to environment variables

## ⚡ API Endpoints

### 1. Update Market Prices
```bash
POST /api/market-prices/update-new
Authorization: Bearer {CRON_SECRET}
```
- Fetches data from government APIs
- Falls back to web scraping if APIs fail
- Cleans and validates data
- Upserts to Supabase with duplicate handling

### 2. Get Market Prices
```bash
GET /api/market-prices/data?state=Karnataka&commodity=Rice&limit=50
```
- Supports filtering by state, commodity, date range
- Pagination support
- Search functionality
- Sorting options

### 3. Get Statistics
```bash
POST /api/market-prices/data
Content-Type: application/json
{
  "action": "stats"
}
```
- Returns total records, states count, commodities count
- Last updated timestamp
- Dashboard metrics

### 4. Get Dropdown Data
```bash
POST /api/market-prices/data
Content-Type: application/json
{
  "action": "states"  // or "commodities"
}
```

### 5. Cron Job Endpoint
```bash
GET /api/cron/market-prices
Authorization: Bearer {CRON_SECRET}
```

## 🕒 Scheduled Updates

### Vercel Cron Jobs
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/market-prices",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### External Cron Services
Use services like:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

Set up to call:
```bash
curl -X GET "https://your-app.vercel.app/api/cron/market-prices" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Data Sources

### Primary APIs
1. **Agmarknet**: Government agricultural marketing data
2. **Data.gov.in**: Official government data portal

### Scraping Fallbacks
1. **Karnataka**: Raita Mitra portal
2. **Maharashtra**: Mahaagrinet portal  
3. **Tamil Nadu**: State crop prices portal

### Data Points Collected
- State, District, Market name
- Commodity name and variety
- Minimum, Maximum, Modal prices
- Date and data source
- Price unit (typically Quintal)

## 🎨 Dashboard Features

### Components Created
- **Market Prices Dashboard**: `/components/market-prices-dashboard.tsx`
- **Market Prices Page**: `/app/(app)/market-prices-new/page.tsx`

### Dashboard Includes
1. **Statistics Cards**: Total records, states, commodities, last updated
2. **Advanced Filters**: State, commodity, date range, search
3. **Price Trend Chart**: Historical price movements
4. **Top Commodities Chart**: Most tracked items
5. **Data Table**: Detailed price records with pagination
6. **Real-time Updates**: Manual refresh button
7. **Export Functionality**: Data download options

### Chart Features
- **Recharts Integration**: Professional charts and graphs
- **Price Trend Analysis**: Line charts showing price movements
- **Commodity Volume**: Bar charts showing data availability
- **Responsive Design**: Mobile-friendly layouts
- **Interactive Tooltips**: Detailed data on hover

## 🔧 Technical Implementation

### Data Flow
1. **Cron Job** → Triggers update endpoint
2. **Update API** → Fetches from government sources
3. **Data Cleaning** → Normalizes and validates data
4. **Supabase Upsert** → Stores with conflict resolution
5. **Dashboard** → Displays real-time data

### Error Handling
- **API Retry Logic**: 3 attempts with exponential backoff
- **Fallback Strategies**: Scraping when APIs fail
- **Data Validation**: Filters invalid entries
- **Batch Processing**: Handles large datasets efficiently
- **Error Logging**: Comprehensive error tracking

### Performance Optimizations
- **Batch Inserts**: 100 records per batch for Supabase
- **Caching Strategies**: Client-side data caching
- **Pagination**: Efficient data loading
- **Indexes**: Database performance optimization
- **Lazy Loading**: Chart data loaded on demand

## 🚀 Deployment Checklist

### 1. Environment Setup
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Environment variables configured
- [ ] API keys secured

### 2. Code Deployment
- [ ] Code pushed to repository
- [ ] Vercel/Netlify deployment configured
- [ ] Domain configured (if custom)
- [ ] SSL certificate active

### 3. Cron Job Setup
- [ ] Cron secret generated
- [ ] Cron job service configured
- [ ] First manual update tested
- [ ] Schedule verified (daily at 6 AM)

### 4. Testing
- [ ] Manual data update works
- [ ] Dashboard loads correctly
- [ ] Filters and search functional
- [ ] Charts display properly
- [ ] Mobile responsiveness verified

## 📈 Monitoring & Maintenance

### Health Checks
- Monitor cron job success rates
- Check API response times
- Verify data freshness
- Track error rates

### Data Quality
- Validate price ranges for reasonableness
- Check for duplicate entries
- Monitor source availability
- Verify data completeness

### Performance Monitoring
- Database query performance
- API endpoint response times
- Dashboard loading speeds
- Chart rendering performance

## 🐛 Troubleshooting

### Common Issues

#### 1. Cron Job Not Running
```bash
# Check cron job logs
curl -X GET "https://your-app.vercel.app/api/cron/market-prices" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### 2. Data Not Updating
- Verify API endpoints are accessible
- Check Supabase connection
- Review error logs in dashboard
- Test manual update

#### 3. Dashboard Not Loading
- Check environment variables
- Verify Supabase RLS policies
- Check browser console errors
- Test API endpoints directly

#### 4. Charts Not Displaying
- Verify data format
- Check Recharts version compatibility
- Review console errors
- Test with sample data

## 📝 Usage Examples

### Manual Data Update
```javascript
const updateResponse = await fetch('/api/market-prices/update-new', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer dev',  // Development only
    'Content-Type': 'application/json'
  }
});
```

### Fetch Market Prices
```javascript
const pricesResponse = await fetch('/api/market-prices/data?state=Karnataka&limit=100');
const result = await pricesResponse.json();
console.log(`Found ${result.data.length} prices`);
```

### Get Statistics
```javascript
const statsResponse = await fetch('/api/market-prices/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'stats' })
});
```

## 🎯 Next Steps

### Enhancements
1. **Price Alerts**: Email/SMS notifications for price thresholds
2. **Predictive Analytics**: ML-based price forecasting
3. **Export Options**: CSV, Excel, PDF downloads
4. **API Rate Limiting**: Prevent abuse
5. **Multi-language Support**: Regional language support
6. **Mobile App**: React Native mobile application

### Scaling Considerations
1. **Database Sharding**: For very large datasets
2. **CDN Integration**: Faster global data delivery
3. **Microservices**: Separate update and read services
4. **Load Balancing**: Handle high traffic
5. **Caching Layer**: Redis for frequently accessed data

---

## 🎉 System is Ready!

Your Market Prices system is now production-ready with:
✅ **Complete API Integration** with government data sources
✅ **Web Scraping Fallbacks** for high availability
✅ **Production-grade Database** with Supabase
✅ **Interactive Dashboard** with charts and filters
✅ **Automated Updates** via cron jobs
✅ **Error Handling** and monitoring
✅ **Mobile-responsive Design**

Navigate to `/market-prices-new` to see your dashboard in action!

// ============================================================================
// MARKET PRICES API ROUTES
// Endpoints: /api/prices, /api/prices/latest, /api/prices/trends, /api/prices/sync
// ============================================================================

const express = require('express');
const router = express.Router();
const MarketPricesScraper = require('../services/scraper');
const cache = require('../utils/cache');
const moment = require('moment-timezone');

const scraper = new MarketPricesScraper();

/**
 * GET /api/prices
 * Returns all market price records with optional filters
 * Query params: state, commodity, from, to, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 GET /api/prices - Query:', req.query);
    
    // Try cache first
    const cacheKey = `prices_${JSON.stringify(req.query)}`;
    let cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.records,
        metadata: {
          total_records: cachedData.total_records,
          filtered_records: cachedData.filtered_records,
          last_updated: cachedData.last_updated,
          source: 'cache'
        }
      });
    }

    // Load from JSON file
    const marketData = await scraper.loadMarketPrices();
    let { records } = marketData;

    // Apply filters
    const { state, commodity, from, to, limit = 100, offset = 0 } = req.query;

    if (state) {
      records = records.filter(record => 
        record.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (commodity) {
      records = records.filter(record => 
        record.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }

    if (from) {
      records = records.filter(record => 
        moment(record.date).isAfter(moment(from).subtract(1, 'day'))
      );
    }

    if (to) {
      records = records.filter(record => 
        moment(record.date).isBefore(moment(to).add(1, 'day'))
      );
    }

    // Sort by date (latest first)
    records.sort((a, b) => moment(b.date) - moment(a.date));

    // Pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = records.slice(startIndex, endIndex);

    const responseData = {
      records: paginatedRecords,
      total_records: marketData.total_records,
      filtered_records: records.length,
      last_updated: marketData.last_updated,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: endIndex < records.length
      }
    };

    // Cache the response
    cache.set(cacheKey, responseData, 30 * 60 * 1000); // 30 minutes

    res.json({
      success: true,
      data: paginatedRecords,
      metadata: {
        total_records: marketData.total_records,
        filtered_records: records.length,
        last_updated: marketData.last_updated,
        pagination: responseData.pagination,
        source: 'json'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching prices:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market prices',
      details: error.message
    });
  }
});

/**
 * GET /api/prices/latest
 * Returns latest price entry per commodity/market combination
 */
router.get('/latest', async (req, res) => {
  try {
    console.log('📊 GET /api/prices/latest');
    
    const cacheKey = 'latest_prices';
    let cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        metadata: {
          total_records: cachedData.length,
          source: 'cache'
        }
      });
    }

    const marketData = await scraper.loadMarketPrices();
    const { records } = marketData;

    // Group by commodity and market, get latest for each
    const latestMap = {};
    
    records.forEach(record => {
      const key = `${record.commodity}_${record.market}_${record.state}`;
      if (!latestMap[key] || moment(record.date).isAfter(moment(latestMap[key].date))) {
        latestMap[key] = record;
      }
    });

    const latestPrices = Object.values(latestMap);
    
    // Sort by date (latest first)
    latestPrices.sort((a, b) => moment(b.date) - moment(a.date));

    // Cache for 1 hour
    cache.set(cacheKey, latestPrices, 60 * 60 * 1000);

    res.json({
      success: true,
      data: latestPrices,
      metadata: {
        total_records: latestPrices.length,
        last_updated: marketData.last_updated,
        source: 'json'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching latest prices:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest prices',
      details: error.message
    });
  }
});

/**
 * GET /api/prices/trends
 * Returns historical price trends for specific commodity/state
 * Query params: commodity (required), state (optional)
 */
router.get('/trends', async (req, res) => {
  try {
    const { commodity, state } = req.query;
    
    if (!commodity) {
      return res.status(400).json({
        success: false,
        error: 'Commodity parameter is required'
      });
    }

    console.log(`📈 GET /api/prices/trends - Commodity: ${commodity}, State: ${state}`);
    
    const cacheKey = `trends_${commodity}_${state || 'all'}`;
    let cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        metadata: {
          commodity,
          state: state || 'All States',
          source: 'cache'
        }
      });
    }

    const marketData = await scraper.loadMarketPrices();
    let { records } = marketData;

    // Filter by commodity
    records = records.filter(record => 
      record.commodity.toLowerCase().includes(commodity.toLowerCase())
    );

    // Filter by state if provided
    if (state) {
      records = records.filter(record => 
        record.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    // Group by date and calculate averages
    const trendMap = {};
    
    records.forEach(record => {
      const date = record.date;
      if (!trendMap[date]) {
        trendMap[date] = {
          date,
          prices: [],
          count: 0
        };
      }
      
      trendMap[date].prices.push(record.modal_price);
      trendMap[date].count++;
    });

    // Calculate averages and format for charts
    const trends = Object.values(trendMap).map(day => ({
      date: day.date,
      average_price: Math.round(day.prices.reduce((sum, price) => sum + price, 0) / day.prices.length),
      min_price: Math.min(...day.prices),
      max_price: Math.max(...day.prices),
      market_count: day.count,
      formatted_date: moment(day.date).format('MMM DD, YYYY')
    }));

    // Sort by date
    trends.sort((a, b) => moment(a.date) - moment(b.date));

    // Cache for 2 hours
    cache.set(cacheKey, trends, 2 * 60 * 60 * 1000);

    res.json({
      success: true,
      data: trends,
      metadata: {
        commodity,
        state: state || 'All States',
        total_days: trends.length,
        date_range: trends.length > 0 ? {
          from: trends[0].date,
          to: trends[trends.length - 1].date
        } : null,
        source: 'json'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching trends:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price trends',
      details: error.message
    });
  }
});

/**
 * POST /api/prices/sync
 * Manual refresh - force scrape/API call
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 POST /api/prices/sync - Manual refresh triggered');
    
    // Clear cache
    cache.clear();
    
    // Run scraper
    const result = await scraper.scrapeMarketPrices();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Market prices refreshed successfully',
        data: {
          records_collected: result.records,
          timestamp: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST')
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to refresh market prices',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error during manual sync:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync market prices',
      details: error.message
    });
  }
});

/**
 * GET /api/prices/stats
 * Get summary statistics about the market prices data
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/prices/stats');
    
    const cacheKey = 'price_stats';
    let cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        metadata: { source: 'cache' }
      });
    }

    const marketData = await scraper.loadMarketPrices();
    const { records } = marketData;

    const stats = {
      total_records: records.length,
      unique_states: [...new Set(records.map(r => r.state))].length,
      unique_commodities: [...new Set(records.map(r => r.commodity))].length,
      unique_markets: [...new Set(records.map(r => r.market))].length,
      date_range: {
        oldest: records.length > 0 ? moment.min(records.map(r => moment(r.date))).format('YYYY-MM-DD') : null,
        newest: records.length > 0 ? moment.max(records.map(r => moment(r.date))).format('YYYY-MM-DD') : null
      },
      price_range: {
        min: records.length > 0 ? Math.min(...records.map(r => r.min_price)) : 0,
        max: records.length > 0 ? Math.max(...records.map(r => r.max_price)) : 0
      },
      sources: [...new Set(records.map(r => r.source))],
      last_updated: marketData.last_updated,
      next_update: marketData.next_update
    };

    // Top commodities by market coverage
    const commodityMarkets = {};
    records.forEach(record => {
      if (!commodityMarkets[record.commodity]) {
        commodityMarkets[record.commodity] = new Set();
      }
      commodityMarkets[record.commodity].add(`${record.market}_${record.state}`);
    });

    stats.top_commodities = Object.entries(commodityMarkets)
      .map(([commodity, markets]) => ({
        commodity,
        market_count: markets.size
      }))
      .sort((a, b) => b.market_count - a.market_count)
      .slice(0, 10);

    // Cache for 1 hour
    cache.set(cacheKey, stats, 60 * 60 * 1000);

    res.json({
      success: true,
      data: stats,
      metadata: { source: 'json' }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

module.exports = router;

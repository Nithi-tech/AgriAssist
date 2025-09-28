const fs = require('fs').promises;
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, '../data/marketPrices.json');

/**
 * Check if two dates are in the same week (Sunday to Saturday)
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
function isSameWeek(date1, date2) {
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0, so subtract day to get Sunday
    return new Date(d.setDate(diff));
  };

  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  
  return week1Start.getTime() === week2Start.getTime();
}

/**
 * Check if today is Sunday
 * @returns {boolean}
 */
function isSunday() {
  return new Date().getDay() === 0;
}

/**
 * Check if we need to update data (Sunday + different week)
 * @param {string} lastUpdatedISO 
 * @returns {boolean}
 */
function shouldUpdateData(lastUpdatedISO) {
  if (!lastUpdatedISO) return true; // First time
  
  const lastUpdated = new Date(lastUpdatedISO);
  const now = new Date();
  
  return isSunday() && !isSameWeek(lastUpdated, now);
}

/**
 * Read market prices data from JSON file
 * @returns {Promise<Object>} Market prices data
 */
async function readMarketData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default structure
      return {
        lastUpdated: null,
        prices: [],
        stats: {
          totalRecords: 0,
          lastFetchSuccess: false,
          error: 'No data available yet'
        },
        metadata: {
          source: 'initial',
          fetchAttempts: 0,
          lastSuccessfulFetch: null
        }
      };
    }
    throw error;
  }
}

/**
 * Write market prices data to JSON file
 * @param {Object} data Market prices data
 * @returns {Promise<void>}
 */
async function writeMarketData(data) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Add metadata
    const dataWithMetadata = {
      ...data,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...data.metadata,
        lastWrite: new Date().toISOString(),
        fileSize: JSON.stringify(data).length
      }
    };
    
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dataWithMetadata, null, 2));
    console.log(`✅ Market data saved to ${DATA_FILE_PATH}`);
  } catch (error) {
    console.error('❌ Error writing market data:', error);
    throw error;
  }
}

/**
 * Mock function to simulate fetching data from external API
 * Replace this with actual API calls to market data providers
 * @returns {Promise<Object>} Fresh market data
 */
async function fetchFreshMarketData() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure (80% success rate)
  if (Math.random() < 0.2) {
    throw new Error('External API unavailable');
  }
  
  // Generate mock market data
  const states = ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Punjab', 'Uttar Pradesh'];
  const commodities = ['Rice', 'Wheat', 'Tomato', 'Onion', 'Potato', 'Sugarcane'];
  const markets = ['Wholesale Market', 'Retail Market', 'Mandi', 'Regulated Market'];
  
  const prices = [];
  const recordCount = 50 + Math.floor(Math.random() * 100); // 50-150 records
  
  for (let i = 0; i < recordCount; i++) {
    const state = states[Math.floor(Math.random() * states.length)];
    const commodity = commodities[Math.floor(Math.random() * commodities.length)];
    const market = markets[Math.floor(Math.random() * markets.length)];
    const basePrice = 1000 + Math.floor(Math.random() * 5000);
    
    prices.push({
      id: `price_${i + 1}`,
      state,
      commodity,
      market,
      date: new Date().toISOString().split('T')[0],
      minPrice: basePrice - 200,
      maxPrice: basePrice + 300,
      modalPrice: basePrice,
      unit: 'per quintal',
      source: 'Market API',
      lastUpdated: new Date().toISOString()
    });
  }
  
  const stats = {
    totalRecords: prices.length,
    averagePrice: Math.round(prices.reduce((sum, p) => sum + p.modalPrice, 0) / prices.length),
    statesCount: new Set(prices.map(p => p.state)).size,
    commoditiesCount: new Set(prices.map(p => p.commodity)).size,
    lastFetchSuccess: true,
    fetchTimestamp: new Date().toISOString()
  };
  
  return {
    prices,
    stats,
    metadata: {
      source: 'external_api',
      fetchAttempts: 1,
      lastSuccessfulFetch: new Date().toISOString()
    }
  };
}

/**
 * Get market data with smart weekly update logic
 * @returns {Promise<Object>} Market data
 */
async function getMarketData() {
  try {
    // Read existing data
    const existingData = await readMarketData();
    
    // Check if we should update (Sunday + different week)
    const needsUpdate = shouldUpdateData(existingData.lastUpdated);
    
    if (needsUpdate) {
      console.log('📅 Sunday update required, fetching fresh data...');
      
      try {
        // Try to fetch fresh data
        const freshData = await fetchFreshMarketData();
        
        // Save fresh data
        await writeMarketData(freshData);
        
        console.log(`✅ Fresh data fetched and saved (${freshData.prices.length} records)`);
        return freshData;
        
      } catch (fetchError) {
        console.warn('⚠️ Failed to fetch fresh data on Sunday, using cached data:', fetchError.message);
        
        // Update metadata to indicate failed fetch attempt
        const updatedData = {
          ...existingData,
          stats: {
            ...existingData.stats,
            lastFetchSuccess: false,
            lastFetchError: fetchError.message,
            lastFetchAttempt: new Date().toISOString()
          },
          metadata: {
            ...existingData.metadata,
            fetchAttempts: (existingData.metadata?.fetchAttempts || 0) + 1
          }
        };
        
        await writeMarketData(updatedData);
        return updatedData;
      }
    } else {
      console.log('📊 Using cached weekly data (no update needed)');
      return existingData;
    }
    
  } catch (error) {
    console.error('❌ Error getting market data:', error);
    
    // Last resort: return minimal data structure
    return {
      lastUpdated: new Date().toISOString(),
      prices: [],
      stats: {
        totalRecords: 0,
        lastFetchSuccess: false,
        error: 'System error: ' + error.message
      },
      metadata: {
        source: 'error_fallback',
        fetchAttempts: 0,
        lastSuccessfulFetch: null
      }
    };
  }
}

module.exports = {
  getMarketData,
  readMarketData,
  writeMarketData,
  fetchFreshMarketData,
  shouldUpdateData,
  isSameWeek,
  isSunday
};

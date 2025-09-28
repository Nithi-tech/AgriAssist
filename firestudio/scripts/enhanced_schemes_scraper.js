const { chromium } = require('playwright');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced Configuration
const CONFIG = {
  baseUrl: 'https://www.myscheme.gov.in',
  apiEndpoint: 'https://www.myscheme.gov.in/api/schemes', // Try API first
  outputDir: path.join(__dirname, '../data'),
  rateLimit: 2000, // 2 seconds between requests (slower for stability)
  maxRetries: 5,
  timeout: 30000, // 30 seconds timeout
  maxConcurrency: 3, // Max parallel requests
  pagination: {
    maxPages: 100, // Safety limit
    pageSize: 50,
    loadMoreSelector: '.load-more-btn, .show-more, .pagination-next',
    infiniteScrollSelector: '.scheme-list, .schemes-container'
  }
};

// Enhanced utility functions
const normalizeText = (text) => {
  return text
    ?.trim()
    ?.replace(/\s+/g, ' ')
    ?.replace(/[^\w\s\-.,!?]/g, '')
    ?.slice(0, 1000) // Limit length
    || '';
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async (fn, retries = CONFIG.maxRetries) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await sleep(CONFIG.rateLimit * (i + 1)); // Exponential backoff
    }
  }
};

// Enhanced scraping class
class EnhancedSchemesScraper {
  constructor() {
    this.schemes = new Map(); // Use Map to prevent duplicates
    this.errors = [];
    this.stats = {
      totalPagesVisited: 0,
      totalSchemesFound: 0,
      uniqueSchemes: 0,
      skippedPages: 0,
      errors: 0,
      apiCallsSuccessful: 0,
      scrapingFallbackUsed: 0
    };
  }

  async tryApiFirst() {
    console.log('🔍 Attempting to use API endpoint...');
    
    try {
      // Try common API patterns
      const apiUrls = [
        'https://www.myscheme.gov.in/api/schemes',
        'https://www.myscheme.gov.in/api/v1/schemes',
        'https://api.myscheme.gov.in/schemes',
        'https://www.myscheme.gov.in/search/api/schemes'
      ];

      for (const apiUrl of apiUrls) {
        try {
          console.log(`Trying API: ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SchemesScraper/1.0)',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ API success! Found data structure:`, Object.keys(data));
            
            // Try to extract schemes from various data structures
            let schemes = [];
            if (Array.isArray(data)) {
              schemes = data;
            } else if (data.schemes && Array.isArray(data.schemes)) {
              schemes = data.schemes;
            } else if (data.data && Array.isArray(data.data)) {
              schemes = data.data;
            } else if (data.results && Array.isArray(data.results)) {
              schemes = data.results;
            }

            if (schemes.length > 0) {
              this.stats.apiCallsSuccessful++;
              return this.processApiSchemes(schemes);
            }
          }
        } catch (err) {
          console.log(`API ${apiUrl} failed:`, err.message);
        }
      }
    } catch (error) {
      console.log('API approach failed:', error.message);
    }
    
    return null;
  }

  processApiSchemes(schemes) {
    console.log(`Processing ${schemes.length} schemes from API...`);
    
    const processedSchemes = schemes.map(scheme => ({
      id: scheme.id || this.generateId(),
      scheme_name: normalizeText(scheme.name || scheme.title || scheme.scheme_name),
      state: normalizeText(scheme.state || scheme.location || 'Unknown'),
      category: normalizeText(scheme.category || scheme.type),
      eligibility: normalizeText(scheme.eligibility || scheme.criteria),
      explanation: normalizeText(scheme.description || scheme.details || scheme.explanation),
      benefit_amount: this.extractBenefitAmount(scheme.benefit || scheme.amount),
      link: scheme.url || scheme.link || scheme.apply_link,
      source_url: 'API',
      scraped_at: new Date().toISOString()
    })).filter(scheme => scheme.scheme_name);

    processedSchemes.forEach(scheme => {
      const key = `${scheme.scheme_name.toLowerCase()}-${scheme.state.toLowerCase()}`;
      this.schemes.set(key, scheme);
    });

    this.stats.totalSchemesFound += processedSchemes.length;
    return processedSchemes;
  }

  async scrapeWithPagination() {
    console.log('🔍 Starting enhanced web scraping with pagination...');
    this.stats.scrapingFallbackUsed++;

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(CONFIG.timeout);

    try {
      await this.scrapeMainPage(page);
      await this.scrapeStatePages(page);
      await this.scrapeCategoryPages(page);
    } catch (error) {
      console.error('Scraping error:', error);
      this.errors.push({ type: 'SCRAPING', error: error.message });
    } finally {
      await browser.close();
    }
  }

  async scrapeMainPage(page) {
    console.log('📄 Scraping main page...');
    
    await retry(async () => {
      await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
    });

    // Try different selectors for scheme listings
    const selectors = [
      '.scheme-card',
      '.scheme-item',
      '.scheme-box',
      '.card',
      '[data-scheme]',
      '.listing-item'
    ];

    let schemesFound = false;
    for (const selector of selectors) {
      const schemes = await this.extractSchemesFromSelector(page, selector);
      if (schemes.length > 0) {
        console.log(`✅ Found ${schemes.length} schemes using selector: ${selector}`);
        schemesFound = true;
        break;
      }
    }

    if (!schemesFound) {
      console.log('⚠️ No schemes found on main page, trying alternative approach...');
      await this.tryAlternativeApproaches(page);
    }

    // Handle pagination on main page
    await this.handlePagination(page);
  }

  async scrapeStatePages(page) {
    console.log('🗺️ Scraping state-specific pages...');

    // Extract state links
    const stateLinks = await page.evaluate(() => {
      const links = [];
      
      // Try different selectors for state navigation
      const selectors = [
        'a[href*="state"]',
        '.state-link',
        '.dropdown-item',
        'select[name*="state"] option',
        '.state-menu a'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const href = el.href || el.value;
          const text = el.textContent?.trim();
          if (href && text && text !== 'Select State') {
            links.push({ url: href, state: text });
          }
        });
        if (links.length > 0) break;
      }

      return links;
    });

    console.log(`Found ${stateLinks.length} state pages to scrape`);

    // Process each state page
    for (const stateLink of stateLinks.slice(0, 36)) { // Limit to ~36 states/UTs
      try {
        await this.scrapeStatePage(page, stateLink);
        await sleep(CONFIG.rateLimit);
      } catch (error) {
        console.error(`Error scraping state ${stateLink.state}:`, error);
        this.errors.push({ type: 'STATE', state: stateLink.state, error: error.message });
      }
    }
  }

  async scrapeStatePage(page, stateLink) {
    console.log(`Scraping ${stateLink.state}...`);

    await retry(async () => {
      await page.goto(stateLink.url, { waitUntil: 'networkidle' });
    });

    const schemes = await this.extractSchemesFromPage(page, stateLink.state);
    await this.handlePagination(page, stateLink.state);
    
    this.stats.totalPagesVisited++;
  }

  async extractSchemesFromSelector(page, selector) {
    return await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => {
        return {
          scheme_name: el.querySelector('.title, .name, h3, h4, .scheme-title')?.textContent?.trim(),
          description: el.querySelector('.description, .details, p, .scheme-desc')?.textContent?.trim(),
          eligibility: el.querySelector('.eligibility, .criteria, .eligible')?.textContent?.trim(),
          link: el.querySelector('a')?.href,
          category: el.querySelector('.category, .type, .badge')?.textContent?.trim()
        };
      }).filter(scheme => scheme.scheme_name);
    }, selector);
  }

  async extractSchemesFromPage(page, stateName = 'Unknown') {
    const schemes = [];
    
    // Try multiple extraction strategies
    const extractors = [
      () => this.extractSchemesFromSelector(page, '.scheme-card'),
      () => this.extractSchemesFromJSON(page),
      () => this.extractFromTables(page),
      () => this.extractFromListItems(page)
    ];

    for (const extractor of extractors) {
      try {
        const extracted = await extractor();
        if (extracted.length > 0) {
          schemes.push(...extracted);
          break;
        }
      } catch (err) {
        console.log('Extraction method failed:', err.message);
      }
    }

    // Process and store schemes
    schemes.forEach(rawScheme => {
      const scheme = {
        id: this.generateId(),
        scheme_name: normalizeText(rawScheme.scheme_name),
        state: stateName,
        category: normalizeText(rawScheme.category),
        eligibility: normalizeText(rawScheme.eligibility),
        explanation: normalizeText(rawScheme.description),
        benefit_amount: this.extractBenefitAmount(rawScheme.description),
        link: rawScheme.link,
        source_url: page.url(),
        scraped_at: new Date().toISOString()
      };

      if (scheme.scheme_name) {
        const key = `${scheme.scheme_name.toLowerCase()}-${scheme.state.toLowerCase()}`;
        this.schemes.set(key, scheme);
      }
    });

    this.stats.totalSchemesFound += schemes.length;
    return schemes;
  }

  async extractSchemesFromJSON(page) {
    // Look for JSON data in script tags
    return await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent;
        if (text?.includes('schemes') || text?.includes('data')) {
          try {
            // Try to extract JSON from various patterns
            const jsonMatches = text.match(/{[^}]*schemes[^}]*}/g) || 
                               text.match(/\[[^\]]*scheme[^\]]*\]/g);
            
            for (const match of jsonMatches || []) {
              const data = JSON.parse(match);
              if (Array.isArray(data) && data.length > 0) {
                return data;
              }
              if (data.schemes && Array.isArray(data.schemes)) {
                return data.schemes;
              }
            }
          } catch (e) {
            // Continue to next script
          }
        }
      }
      return [];
    });
  }

  async handlePagination(page, context = 'main') {
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= CONFIG.pagination.maxPages) {
      try {
        // Look for pagination controls
        const nextButton = await page.locator(CONFIG.pagination.loadMoreSelector).first();
        
        if (await nextButton.isVisible()) {
          console.log(`📄 Loading page ${currentPage + 1} for ${context}...`);
          
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          await sleep(CONFIG.rateLimit);
          
          // Extract schemes from new content
          await this.extractSchemesFromPage(page, context);
          currentPage++;
        } else {
          // Try infinite scroll
          hasNextPage = await this.handleInfiniteScroll(page);
          if (!hasNextPage) break;
        }
      } catch (error) {
        console.log(`Pagination ended for ${context}:`, error.message);
        hasNextPage = false;
      }
    }
  }

  async handleInfiniteScroll(page) {
    const previousSchemeCount = this.schemes.size;
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await sleep(2000); // Wait for content to load
    
    // Check if new content loaded
    await this.extractSchemesFromPage(page);
    const newSchemeCount = this.schemes.size;
    
    return newSchemeCount > previousSchemeCount;
  }

  extractBenefitAmount(text) {
    if (!text) return null;
    const matches = text.match(/₹\s*(\d+(?:,\d+)*)/g) || text.match(/Rs\.?\s*(\d+(?:,\d+)*)/g);
    if (matches) {
      return parseInt(matches[0].replace(/[₹Rs.,\s]/g, ''));
    }
    return null;
  }

  generateId() {
    return 'scheme-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  async saveResults() {
    const uniqueSchemes = Array.from(this.schemes.values());
    this.stats.uniqueSchemes = uniqueSchemes.length;

    console.log(`\n✅ Scraping completed! Found ${uniqueSchemes.length} unique schemes`);
    
    try {
      // Ensure output directory exists
      await fs.mkdir(CONFIG.outputDir, { recursive: true });
      
      // Save JSON file
      const outputData = {
        schemes: uniqueSchemes,
        meta: {
          total_schemes: uniqueSchemes.length,
          unique_states: [...new Set(uniqueSchemes.map(s => s.state))].length,
          unique_categories: [...new Set(uniqueSchemes.map(s => s.category).filter(Boolean))].length,
          last_updated: new Date().toISOString(),
          stats: this.stats,
          scraping_method: this.stats.apiCallsSuccessful > 0 ? 'API' : 'Web Scraping'
        }
      };

      await fs.writeFile(
        path.join(CONFIG.outputDir, 'welfare_schemes.json'),
        JSON.stringify(outputData, null, 2)
      );

      // Save to Supabase
      if (uniqueSchemes.length > 0) {
        await this.saveToSupabase(uniqueSchemes);
      }

      // Save log
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      await fs.writeFile(
        path.join(CONFIG.outputDir, `scrape_log_${timestamp}.json`),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          stats: this.stats,
          errors: this.errors
        }, null, 2)
      );

      console.log('📊 Final Stats:', this.stats);
      console.log(`💾 Saved ${uniqueSchemes.length} schemes to welfare_schemes.json`);
      
    } catch (err) {
      console.error('❌ Error saving data:', err);
      throw err;
    }
  }

  async saveToSupabase(schemes) {
    try {
      console.log('💾 Saving to Supabase...');
      
      const { data, error } = await supabase
        .from('welfare_schemes')
        .upsert(
          schemes.map(scheme => ({
            ...scheme,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'scheme_name,state',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log('✅ Successfully saved to Supabase');
      
    } catch (err) {
      console.error('❌ Error saving to Supabase:', err);
      this.errors.push({ type: 'DATABASE', error: err.message });
    }
  }

  async scrapeCategoryPages(page) {
    console.log('🏷️ Scraping category-specific pages...');
    
    // Common scheme categories to search for
    const categories = [
      'agriculture', 'farmer', 'crop', 'irrigation', 'fertilizer',
      'health', 'education', 'employment', 'women', 'elderly',
      'disability', 'housing', 'rural', 'urban', 'tribal'
    ];

    for (const category of categories) {
      try {
        // Try search for each category
        await this.searchByCategory(page, category);
        await sleep(CONFIG.rateLimit);
      } catch (error) {
        console.error(`Error scraping category ${category}:`, error);
      }
    }
  }

  async searchByCategory(page, category) {
    try {
      // Try to find and use search functionality
      const searchInput = page.locator('input[type="search"], input[name*="search"], .search-input').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill(category);
        
        const searchButton = page.locator('button[type="submit"], .search-btn, .btn-search').first();
        if (await searchButton.isVisible()) {
          await searchButton.click();
          await page.waitForLoadState('networkidle');
          
          await this.extractSchemesFromPage(page, `Category: ${category}`);
          await this.handlePagination(page, category);
        }
      }
    } catch (error) {
      console.log(`Search for category ${category} failed:`, error.message);
    }
  }

  async tryAlternativeApproaches(page) {
    // Alternative extraction methods
    const alternatives = [
      () => this.extractFromTables(page),
      () => this.extractFromListItems(page),
      () => this.extractFromDirectLinks(page)
    ];

    for (const alternative of alternatives) {
      try {
        const schemes = await alternative();
        if (schemes.length > 0) {
          console.log(`✅ Alternative method found ${schemes.length} schemes`);
          return;
        }
      } catch (err) {
        console.log('Alternative method failed:', err.message);
      }
    }
  }

  async extractFromTables(page) {
    return await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const schemes = [];
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        for (const row of rows) {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const text = Array.from(cells).map(cell => cell.textContent?.trim()).join(' | ');
            if (text.toLowerCase().includes('scheme') || text.toLowerCase().includes('yojana')) {
              schemes.push({
                scheme_name: cells[0]?.textContent?.trim(),
                description: cells[1]?.textContent?.trim(),
                link: row.querySelector('a')?.href
              });
            }
          }
        }
      }
      
      return schemes.filter(s => s.scheme_name);
    });
  }

  async extractFromListItems(page) {
    return await page.evaluate(() => {
      const lists = document.querySelectorAll('ul, ol');
      const schemes = [];
      
      for (const list of lists) {
        const items = list.querySelectorAll('li');
        for (const item of items) {
          const text = item.textContent?.trim();
          if (text && (text.toLowerCase().includes('scheme') || text.toLowerCase().includes('yojana'))) {
            schemes.push({
              scheme_name: text.split('.')[0] || text.substring(0, 100),
              description: text,
              link: item.querySelector('a')?.href
            });
          }
        }
      }
      
      return schemes;
    });
  }

  async run() {
    console.log('🚀 Starting Enhanced Government Schemes Scraper...');
    
    // Try API first
    const apiResults = await this.tryApiFirst();
    
    if (!apiResults || apiResults.length < 100) {
      console.log('📄 API insufficient, falling back to web scraping...');
      await this.scrapeWithPagination();
    }
    
    await this.saveResults();
    
    console.log('🎉 Scraping process completed successfully!');
    return Array.from(this.schemes.values());
  }
}

// Run the enhanced scraper
if (require.main === module) {
  const scraper = new EnhancedSchemesScraper();
  scraper.run().catch(console.error);
}

module.exports = { EnhancedSchemesScraper };

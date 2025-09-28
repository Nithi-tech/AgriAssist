const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration for comprehensive scraping
const CONFIG = {
  baseUrl: 'https://www.myscheme.gov.in',
  outputDir: path.join(__dirname, '../data'),
  rateLimit: 2000, // 2 seconds between requests
  maxRetries: 3,
  timeout: 30000,
  maxPagesPerState: 10 // Safety limit
};

class ComprehensiveSchemeScraper {
  constructor() {
    this.schemes = new Map();
    this.errors = [];
    this.stats = {
      totalPagesVisited: 0,
      totalSchemesFound: 0,
      uniqueSchemes: 0,
      statesProcessed: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  async scrapeAllSchemes() {
    console.log('🚀 Starting Comprehensive Government Schemes Collection');
    console.log('='.repeat(60));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    try {
      // Strategy 1: MyScheme.gov.in comprehensive scraping
      await this.scrapeMyScheme(page);

      // Strategy 2: Alternative government portals
      await this.scrapeAlternativePortals(page);

      // Strategy 3: Known scheme databases
      await this.scrapeKnownDatabases(page);

    } catch (error) {
      console.error('❌ Fatal scraping error:', error);
      this.errors.push({ type: 'FATAL', error: error.message });
    } finally {
      await browser.close();
    }

    await this.saveResults();
    return Array.from(this.schemes.values());
  }

  async scrapeMyScheme(page) {
    console.log('\n🔍 Phase 1: MyScheme.gov.in Deep Scraping');
    console.log('-'.repeat(40));

    try {
      await page.goto('https://www.myscheme.gov.in', { waitUntil: 'networkidle' });
      
      // Method 1: Search-based discovery
      await this.searchBasedDiscovery(page);

      // Method 2: Category-based scraping
      await this.categoryBasedScraping(page);

      // Method 3: Direct scheme listing
      await this.directSchemeListing(page);

    } catch (error) {
      console.error('MyScheme scraping error:', error);
      this.errors.push({ type: 'MYSCHEME', error: error.message });
    }
  }

  async searchBasedDiscovery(page) {
    const searchTerms = [
      'farmer', 'agriculture', 'crop', 'subsidy', 'loan', 'insurance',
      'health', 'education', 'employment', 'women', 'elderly', 'disability',
      'housing', 'rural', 'urban', 'pension', 'scholarship', 'welfare'
    ];

    for (const term of searchTerms) {
      try {
        console.log(`🔍 Searching for: ${term}`);
        
        // Navigate to search
        await page.goto('https://www.myscheme.gov.in/search', { waitUntil: 'networkidle' });
        
        // Try different search input selectors
        const searchSelectors = [
          'input[type="search"]',
          'input[name="search"]',
          '#search-input',
          '.search-box',
          'input[placeholder*="search" i]'
        ];

        let searchInput = null;
        for (const selector of searchSelectors) {
          try {
            searchInput = await page.locator(selector).first();
            if (await searchInput.isVisible()) break;
          } catch (e) {
            continue;
          }
        }

        if (searchInput && await searchInput.isVisible()) {
          await searchInput.fill(term);
          await searchInput.press('Enter');
          await page.waitForLoadState('networkidle');
          
          await this.extractSchemesFromCurrentPage(page, `Search: ${term}`);
          await this.handlePagination(page, term);
        }

        await this.sleep(CONFIG.rateLimit);

      } catch (error) {
        console.log(`Search term ${term} failed:`, error.message);
      }
    }
  }

  async categoryBasedScraping(page) {
    console.log('\n📂 Category-based scraping...');

    // Try to find category navigation
    try {
      await page.goto('https://www.myscheme.gov.in/categories', { waitUntil: 'networkidle' });
      
      // Extract category links
      const categories = await page.evaluate(() => {
        const links = [];
        const selectors = [
          'a[href*="category"]',
          '.category-link',
          '.nav-category',
          '[data-category]',
          '.scheme-category a'
        ];

        for (const selector of selectors) {
          document.querySelectorAll(selector).forEach(link => {
            if (link.href && link.textContent.trim()) {
              links.push({
                url: link.href,
                name: link.textContent.trim()
              });
            }
          });
          if (links.length > 0) break;
        }

        return [...new Map(links.map(l => [l.url, l])).values()];
      });

      console.log(`Found ${categories.length} categories`);

      for (const category of categories.slice(0, 20)) { // Limit to 20 categories
        try {
          console.log(`📂 Processing category: ${category.name}`);
          await page.goto(category.url, { waitUntil: 'networkidle' });
          await this.extractSchemesFromCurrentPage(page, category.name);
          await this.handlePagination(page, category.name);
          await this.sleep(CONFIG.rateLimit);
        } catch (error) {
          console.log(`Category ${category.name} failed:`, error.message);
        }
      }

    } catch (error) {
      console.log('Category scraping failed:', error.message);
    }
  }

  async directSchemeListing(page) {
    console.log('\n📋 Direct scheme listing...');

    const directUrls = [
      'https://www.myscheme.gov.in/schemes/all',
      'https://www.myscheme.gov.in/list',
      'https://www.myscheme.gov.in/browse',
      'https://www.myscheme.gov.in/directory'
    ];

    for (const url of directUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await this.extractSchemesFromCurrentPage(page, 'Direct Listing');
        await this.handlePagination(page, 'Direct');
      } catch (error) {
        console.log(`Direct URL ${url} failed:`, error.message);
      }
    }
  }

  async extractSchemesFromCurrentPage(page, context) {
    const schemes = await page.evaluate(() => {
      const extractedSchemes = [];

      // Try multiple selectors for scheme cards/items
      const cardSelectors = [
        '.scheme-card',
        '.scheme-item',
        '.scheme-box',
        '.card',
        '[data-scheme]',
        '.result-item',
        '.listing-item',
        '.scheme-wrapper'
      ];

      let foundSchemes = false;
      
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Using selector: ${selector}, found ${elements.length} elements`);
          
          elements.forEach(element => {
            const scheme = {
              scheme_name: null,
              description: null,
              eligibility: null,
              link: null,
              category: null,
              state: null
            };

            // Try multiple selectors for scheme name
            const nameSelectors = ['.title', '.name', 'h3', 'h4', '.scheme-title', '.scheme-name', '.heading'];
            for (const nameSelector of nameSelectors) {
              const nameEl = element.querySelector(nameSelector);
              if (nameEl && nameEl.textContent.trim()) {
                scheme.scheme_name = nameEl.textContent.trim();
                break;
              }
            }

            // Try multiple selectors for description
            const descSelectors = ['.description', '.details', 'p', '.scheme-desc', '.content', '.summary'];
            for (const descSelector of descSelectors) {
              const descEl = element.querySelector(descSelector);
              if (descEl && descEl.textContent.trim()) {
                scheme.description = descEl.textContent.trim();
                break;
              }
            }

            // Try multiple selectors for eligibility
            const eligSelectors = ['.eligibility', '.criteria', '.eligible', '.target-group'];
            for (const eligSelector of eligSelectors) {
              const eligEl = element.querySelector(eligSelector);
              if (eligEl && eligEl.textContent.trim()) {
                scheme.eligibility = eligEl.textContent.trim();
                break;
              }
            }

            // Get link
            const linkEl = element.querySelector('a');
            if (linkEl) scheme.link = linkEl.href;

            // Get category
            const catSelectors = ['.category', '.type', '.badge', '.tag'];
            for (const catSelector of catSelectors) {
              const catEl = element.querySelector(catSelector);
              if (catEl && catEl.textContent.trim()) {
                scheme.category = catEl.textContent.trim();
                break;
              }
            }

            // Get state info if available
            const stateSelectors = ['.state', '.location', '.region'];
            for (const stateSelector of stateSelectors) {
              const stateEl = element.querySelector(stateSelector);
              if (stateEl && stateEl.textContent.trim()) {
                scheme.state = stateEl.textContent.trim();
                break;
              }
            }

            if (scheme.scheme_name) {
              extractedSchemes.push(scheme);
            }
          });

          if (extractedSchemes.length > 0) {
            foundSchemes = true;
            break; // Found schemes with this selector, no need to try others
          }
        }
      }

      // Fallback: try to extract from any text content that mentions schemes
      if (!foundSchemes) {
        const allText = document.body.textContent || '';
        const schemeMatches = allText.match(/([^\\n]*(?:scheme|yojana)[^\\n]*)/gi) || [];
        
        schemeMatches.slice(0, 50).forEach((match, index) => { // Limit to 50 matches
          if (match.length > 10 && match.length < 200) {
            extractedSchemes.push({
              scheme_name: match.trim(),
              description: match.trim(),
              eligibility: null,
              link: window.location.href,
              category: null,
              state: null
            });
          }
        });
      }

      return extractedSchemes;
    });

    // Process extracted schemes
    schemes.forEach(rawScheme => {
      if (rawScheme.scheme_name && rawScheme.scheme_name.length > 5) {
        const scheme = {
          id: this.generateId(),
          scheme_name: this.normalizeText(rawScheme.scheme_name),
          state: this.normalizeText(rawScheme.state) || 'India',
          category: this.normalizeText(rawScheme.category) || context,
          eligibility: this.normalizeText(rawScheme.eligibility),
          explanation: this.normalizeText(rawScheme.description),
          benefit_amount: this.extractBenefitAmount(rawScheme.description),
          link: rawScheme.link,
          source_url: page.url(),
          scraped_at: new Date().toISOString(),
          source_context: context
        };

        const key = `${scheme.scheme_name.toLowerCase()}-${scheme.state.toLowerCase()}`;
        this.schemes.set(key, scheme);
      }
    });

    this.stats.totalSchemesFound += schemes.length;
    if (schemes.length > 0) {
      console.log(`  ✅ Extracted ${schemes.length} schemes from ${context}`);
    }

    this.stats.totalPagesVisited++;
  }

  async handlePagination(page, context) {
    let currentPage = 1;
    const maxPages = CONFIG.maxPagesPerState;

    while (currentPage < maxPages) {
      try {
        // Look for pagination controls
        const nextSelectors = [
          '.next-page',
          '.pagination-next',
          'a[aria-label="Next"]',
          '.load-more',
          '.show-more',
          '.btn-next'
        ];

        let nextButton = null;
        for (const selector of nextSelectors) {
          try {
            nextButton = await page.locator(selector).first();
            if (await nextButton.isVisible() && await nextButton.isEnabled()) {
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (nextButton && await nextButton.isVisible() && await nextButton.isEnabled()) {
          console.log(`  📄 Loading page ${currentPage + 1} for ${context}...`);
          
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          await this.sleep(CONFIG.rateLimit);
          
          await this.extractSchemesFromCurrentPage(page, `${context} - Page ${currentPage + 1}`);
          currentPage++;
        } else {
          break; // No more pages
        }

      } catch (error) {
        console.log(`  Pagination ended for ${context}: ${error.message}`);
        break;
      }
    }
  }

  async scrapeAlternativePortals(page) {
    console.log('\n🌐 Phase 2: Alternative Government Portals');
    console.log('-'.repeat(40));

    const portals = [
      {
        name: 'DBT Bharat',
        url: 'https://dbtbharat.gov.in',
        searchPath: '/schemes'
      },
      {
        name: 'Jan Aushadhi',
        url: 'https://janaushadhi.gov.in',
        searchPath: '/schemes'
      },
      {
        name: 'NRLM Portal',
        url: 'https://aajeevika.gov.in',
        searchPath: '/schemes'
      }
    ];

    for (const portal of portals) {
      try {
        console.log(`🌐 Scraping ${portal.name}...`);
        await page.goto(portal.url + portal.searchPath, { waitUntil: 'networkidle' });
        await this.extractSchemesFromCurrentPage(page, portal.name);
        await this.sleep(CONFIG.rateLimit);
      } catch (error) {
        console.log(`${portal.name} failed:`, error.message);
        this.errors.push({ type: portal.name, error: error.message });
      }
    }
  }

  async scrapeKnownDatabases(page) {
    console.log('\n📚 Phase 3: Known Scheme Databases');
    console.log('-'.repeat(40));

    // Add well-known schemes manually to ensure comprehensive coverage
    const knownSchemes = [
      {
        scheme_name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        state: 'India',
        category: 'Agriculture',
        eligibility: 'Small and marginal farmers with landholding up to 2 hectares',
        explanation: 'Financial assistance of ₹6000 per year in three equal installments',
        benefit_amount: 6000,
        link: 'https://www.pmkisan.gov.in/'
      },
      {
        scheme_name: 'Ayushman Bharat - PM-JAY',
        state: 'India',
        category: 'Health',
        eligibility: 'Families listed in SECC 2011 database as per deprivation criteria',
        explanation: 'Health insurance coverage up to ₹5 lakh per family per year',
        benefit_amount: 500000,
        link: 'https://pmjay.gov.in/'
      },
      {
        scheme_name: 'Pradhan Mantri Awas Yojana',
        state: 'India',
        category: 'Housing',
        eligibility: 'Economically Weaker Section (EWS) and Low Income Group (LIG)',
        explanation: 'Affordable housing for urban and rural poor',
        benefit_amount: 250000,
        link: 'https://pmaymis.gov.in/'
      },
      // Add more known schemes...
    ];

    knownSchemes.forEach(scheme => {
      const enrichedScheme = {
        id: this.generateId(),
        ...scheme,
        source_url: 'Known Database',
        scraped_at: new Date().toISOString(),
        source_context: 'Manual Curation'
      };

      const key = `${scheme.scheme_name.toLowerCase()}-${scheme.state.toLowerCase()}`;
      this.schemes.set(key, enrichedScheme);
    });

    console.log(`📚 Added ${knownSchemes.length} well-known schemes`);
  }

  // Utility methods
  normalizeText(text) {
    return text?.trim()?.replace(/\\s+/g, ' ')?.slice(0, 1000) || '';
  }

  extractBenefitAmount(text) {
    if (!text) return null;
    const matches = text.match(/₹\\s*(\\d+(?:,\\d+)*)/g) || text.match(/Rs\\.?\\s*(\\d+(?:,\\d+)*)/g);
    if (matches) {
      return parseInt(matches[0].replace(/[₹Rs.,\\s]/g, ''));
    }
    return null;
  }

  generateId() {
    return 'scheme-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const allSchemes = Array.from(this.schemes.values());
    this.stats.uniqueSchemes = allSchemes.length;
    this.stats.endTime = Date.now();
    
    const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);

    console.log('\\n📊 COLLECTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Pages Visited: ${this.stats.totalPagesVisited}`);
    console.log(`Raw Schemes Found: ${this.stats.totalSchemesFound}`);
    console.log(`Unique Schemes: ${this.stats.uniqueSchemes}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Duration: ${duration} seconds`);

    if (allSchemes.length === 0) {
      console.log('⚠️ No schemes were collected');
      return;
    }

    try {
      await fs.mkdir(CONFIG.outputDir, { recursive: true });

      const outputData = {
        schemes: allSchemes,
        meta: {
          total_schemes: allSchemes.length,
          unique_states: [...new Set(allSchemes.map(s => s.state))].length,
          unique_categories: [...new Set(allSchemes.map(s => s.category).filter(Boolean))].length,
          last_updated: new Date().toISOString(),
          collection_method: 'Comprehensive Web Scraping',
          stats: this.stats
        }
      };

      await fs.writeFile(
        path.join(CONFIG.outputDir, 'welfare_schemes.json'),
        JSON.stringify(outputData, null, 2)
      );

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      await fs.writeFile(
        path.join(CONFIG.outputDir, `scrape_log_${timestamp}.json`),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          stats: this.stats,
          errors: this.errors,
          summary: `Collected ${allSchemes.length} schemes in ${duration} seconds`
        }, null, 2)
      );

      console.log(`\\n💾 Saved ${allSchemes.length} schemes to welfare_schemes.json`);
      
    } catch (error) {
      console.error('❌ Error saving results:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new ComprehensiveSchemeScraper();
  scraper.scrapeAllSchemes().catch(console.error);
}

module.exports = { ComprehensiveSchemeScraper };

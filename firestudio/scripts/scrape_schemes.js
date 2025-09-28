const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://www.myscheme.gov.in',
  outputDir: path.join(__dirname, '../data'),
  rateLimit: 1000, // 1 second between requests
  maxRetries: 3
};

// Utility to normalize text
const normalizeText = (text) => {
  return text
    ?.trim()
    ?.toLowerCase()
    ?.replace(/\s+/g, ' ') // collapse whitespace
    ?.replace(/[^\w\s-]/g, '') // remove punctuation except hyphens
    || '';
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeSchemes() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'AgriAssist Bot (https://agriassist.com/bot) - Scraping welfare schemes for farmers'
  });
  
  const page = await context.newPage();
  const schemes = [];
  const errors = [];
  let stats = {
    totalPagesVisited: 0,
    totalSchemesFound: 0,
    skippedPages: 0,
    errors: 0
  };

  try {
    console.log('Starting scrape of myscheme.gov.in...');
    
    // Navigate to main page
    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('networkidle');
    
    // Get list of states
    const states = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.state-selector option'))
        .map(opt => opt.textContent.trim())
        .filter(state => state && state !== 'Select State');
    });

    console.log(`Found ${states.length} states to process`);

    // Process each state
    for (const state of states) {
      try {
        console.log(`Processing schemes for ${state}...`);
        
        // Select state
        await page.selectOption('.state-selector', state);
        await sleep(CONFIG.rateLimit);
        await page.waitForLoadState('networkidle');
        
        // Extract schemes for this state
        const stateSchemes = await page.evaluate((currentState) => {
          return Array.from(document.querySelectorAll('.scheme-card'))
            .map(card => ({
              id: crypto.randomUUID(), // Add unique ID for React keys
              scheme_name: card.querySelector('.scheme-title')?.textContent?.trim(),
              state: currentState,
              eligibility: card.querySelector('.eligibility')?.textContent?.trim(),
              link: card.querySelector('a.apply-link')?.href,
              explanation: card.querySelector('.scheme-description')?.textContent?.trim(),
              source_url: window.location.href,
              scraped_at: new Date().toISOString()
            }))
            .filter(scheme => scheme.scheme_name && scheme.state);
        }, state);

        schemes.push(...stateSchemes);
        stats.totalSchemesFound += stateSchemes.length;
        stats.totalPagesVisited++;

        console.log(`Found ${stateSchemes.length} schemes for ${state}`);
      } catch (err) {
        console.error(`Error processing state ${state}:`, err);
        errors.push({ state, error: err.message });
        stats.errors++;
        stats.skippedPages++;
      }
    }
  } catch (err) {
    console.error('Fatal error:', err);
    errors.push({ state: 'GLOBAL', error: err.message });
    stats.errors++;
  } finally {
    await browser.close();
  }

  // Remove duplicates using normalized scheme name + state
  const uniqueSchemes = Array.from(
    new Map(
      schemes.map(scheme => [
        `${normalizeText(scheme.scheme_name)}-${normalizeText(scheme.state)}`,
        scheme
      ])
    ).values()
  );

  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Save main JSON file
    await fs.writeFile(
      path.join(CONFIG.outputDir, 'welfare_schemes.json'),
      JSON.stringify({
        schemes: uniqueSchemes,
        meta: {
          total_schemes: uniqueSchemes.length,
          unique_states: [...new Set(uniqueSchemes.map(s => s.state))].length,
          last_updated: new Date().toISOString(),
          stats
        }
      }, null, 2)
    );

    // Save log with timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    await fs.writeFile(
      path.join(CONFIG.outputDir, `scrape_log_${timestamp}.json`),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        stats,
        errors
      }, null, 2)
    );

    console.log('\nScraping completed successfully!');
    console.log('Stats:', stats);
    console.log(`Saved ${uniqueSchemes.length} unique schemes to welfare_schemes.json`);
    
  } catch (err) {
    console.error('Error saving data:', err);
    process.exit(1);
  }
}

// Run the scraper if called directly
if (require.main === module) {
  scrapeSchemes().catch(console.error);
}

module.exports = { scrapeSchemes };

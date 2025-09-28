const { chromium } = require('playwright');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role key for admin access
);

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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
              scheme_name: card.querySelector('.scheme-title')?.textContent?.trim(),
              state: currentState,
              eligibility: card.querySelector('.eligibility')?.textContent?.trim(),
              link: card.querySelector('a.apply-link')?.href,
              explanation: card.querySelector('.scheme-description')?.textContent?.trim(),
              category: card.querySelector('.scheme-category')?.textContent?.trim(),
              source_url: window.location.href
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

  // Save data
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  
  try {
    // Save JSON
    await fs.writeFile(
      path.join(CONFIG.outputDir, `welfare_schemes_${timestamp}.json`),
      JSON.stringify(uniqueSchemes, null, 2)
    );

    // Save CSV
    const csvContent = [
      ['scheme_name', 'state', 'eligibility', 'link', 'explanation', 'category', 'source_url'].join(','),
      ...uniqueSchemes.map(scheme => 
        [
          `"${(scheme.scheme_name || '').replace(/"/g, '""')}"`,
          `"${(scheme.state || '').replace(/"/g, '""')}"`,
          `"${(scheme.eligibility || '').replace(/"/g, '""')}"`,
          `"${(scheme.link || '').replace(/"/g, '""')}"`,
          `"${(scheme.explanation || '').replace(/"/g, '""')}"`,
          `"${(scheme.category || '').replace(/"/g, '""')}"`,
          `"${(scheme.source_url || '').replace(/"/g, '""')}"`
        ].join(',')
      )
    ].join('\n');

    await fs.writeFile(
      path.join(CONFIG.outputDir, `welfare_schemes_${timestamp}.csv`),
      csvContent
    );

    // Save log
    const logContent = {
      timestamp: new Date().toISOString(),
      stats,
      errors
    };

    await fs.writeFile(
      path.join(CONFIG.outputDir, `scrape_log_${timestamp}.json`),
      JSON.stringify(logContent, null, 2)
    );

    // Upsert to Supabase
    const { data, error } = await supabase
      .from('welfare_schemes')
      .upsert(
        uniqueSchemes.map(scheme => ({
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
      throw new Error(`Supabase upsert error: ${error.message}`);
    }

    console.log('\nScraping completed successfully!');
    console.log('Stats:', stats);
    console.log(`Saved ${uniqueSchemes.length} unique schemes`);
    
  } catch (err) {
    console.error('Error saving data:', err);
    process.exit(1);
  }
}

// Run the scraper
scrapeSchemes().catch(console.error);

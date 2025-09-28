import { chromium, Browser, Page } from 'playwright';
import { CheerioAPI, load } from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { 
  normalizeSchemeName, 
  normalizeText, 
  normalizeUrl, 
  createRecordKey, 
  sanitizeHtml,
  htmlToText 
} from '../utils/normalize';

// Types
export interface SchemeRecord {
  scheme_name: string;
  state: string;
  description_html: string | null;
  description_text: string;
  eligibility_html: string | null;
  eligibility_text: string;
  link: string;
  source_url: string;
  scraped_at: string;
}

export interface ScrapingOptions {
  states?: string[];
  saveJson?: string;
  saveToSupabase?: boolean;
  dryRun?: boolean;
  concurrency?: number;
  delay?: number;
  maxRetries?: number;
}

export interface StateInfo {
  name: string;
  url: string;
  slug: string;
}

// Constants
const DEFAULT_DELAY = 400;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_RETRIES = 3;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Real government portals and known scheme pages
const KNOWN_SCHEME_PAGES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    url: 'https://pmkisan.gov.in/',
    state: 'Central',
    description: 'Income support scheme providing ₹6,000 per year to farmer families in three equal installments'
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana',
    url: 'https://pmfby.gov.in/',
    state: 'Central',
    description: 'Crop insurance scheme providing financial support for farmers in case of crop loss due to natural calamities'
  },
  {
    name: 'Soil Health Card Scheme',
    url: 'https://soilhealth.dac.gov.in/',
    state: 'Central',
    description: 'Scheme to promote soil test based nutrient management for improving productivity'
  },
  {
    name: 'National Agriculture Market (eNAM)',
    url: 'https://enam.gov.in/',
    state: 'Central',
    description: 'Online trading platform for agricultural commodities to provide better price discovery'
  },
  {
    name: 'Pradhan Mantri Kisan Sampada Yojana',
    url: 'https://www.mofpi.gov.in/pmksy/',
    state: 'Central',
    description: 'Scheme for development of modern infrastructure with efficient supply chain management'
  }
];

const STATE_PORTALS = {
  'karnataka': [
    {
      name: 'Raita Bandhu Scheme',
      url: 'https://raitamitra.karnataka.gov.in/',
      description: 'Financial assistance of ₹4,000 per acre per season to farmers for cultivation expenses'
    },
    {
      name: 'Krishi Bhagya Scheme', 
      url: 'https://raitamitra.karnataka.gov.in/',
      description: 'Micro irrigation scheme to increase crop productivity and farmer income'
    },
    {
      name: 'Anna Bhagya Scheme',
      url: 'https://ahara.kar.nic.in/',
      description: 'Free food grains distribution scheme providing 5kg rice per person per month to BPL families'
    }
  ],
  'tamil-nadu': [
    {
      name: 'Tamil Nadu Uzhavar Padhukappu Thittam',
      url: 'https://tn.gov.in/',
      description: 'Crop insurance scheme providing coverage against natural calamities and pest attacks'
    },
    {
      name: 'Chief Minister Comprehensive Crop Insurance',
      url: 'https://tn.gov.in/',
      description: 'State-level crop insurance with premium subsidy from government'
    }
  ]
};

export class SchemeScraper {
  private browser: Browser | null = null;
  private stateSlugs: Record<string, string> = {};
  private visitedUrls = new Set<string>();
  private duplicateKeys = new Set<string>();
  private scraped: SchemeRecord[] = [];
  private errors: Array<{ url: string; error: string; timestamp: string }> = [];

  constructor(private options: ScrapingOptions = {}) {
    this.options = {
      concurrency: DEFAULT_CONCURRENCY,
      delay: DEFAULT_DELAY,
      maxRetries: DEFAULT_MAX_RETRIES,
      ...options
    };
  }

  async initialize() {
    console.log('🚀 Initializing government schemes scraper...');
    
    // Load state slugs mapping
    try {
      const slugsPath = path.join(__dirname, '../data/stateSlugs.json');
      const slugsData = await fs.readFile(slugsPath, 'utf-8');
      this.stateSlugs = JSON.parse(slugsData);
    } catch (error) {
      console.warn('⚠️ Could not load state slugs mapping:', error);
    }

    // Initialize Playwright browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    // Ensure directories exist
    await this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = ['logs', 'errors/raw-pages'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(__dirname, `../${dir}`), { recursive: true });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Main scraping orchestrator
   */
  async scrape(): Promise<SchemeRecord[]> {
    await this.initialize();
    
    try {
      console.log('📋 Getting scheme list...');
      
      // First, scrape known central schemes
      await this.scrapeCentralSchemes();
      
      // Then scrape state-specific schemes if requested
      if (this.options.states && this.options.states.length > 0) {
        for (const stateSlug of this.options.states) {
          if (stateSlug !== 'central' && STATE_PORTALS[stateSlug as keyof typeof STATE_PORTALS]) {
            await this.scrapeStateSchemes(stateSlug);
          }
        }
      } else {
        // Default: scrape a few state schemes for demo
        await this.scrapeStateSchemes('karnataka');
        await this.scrapeStateSchemes('tamil-nadu');
      }

      console.log(`✅ Scraping completed! Found ${this.scraped.length} schemes`);
      console.log(`🔄 Duplicates found: ${this.duplicateKeys.size}`);
      console.log(`❌ Errors: ${this.errors.length}`);

      await this.saveLogs();
      
      return this.scraped;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Scrape known central government schemes
   */
  private async scrapeCentralSchemes() {
    console.log('🏛️ Scraping Central Government schemes...');
    
    for (const scheme of KNOWN_SCHEME_PAGES) {
      try {
        await this.delay(this.options.delay!);
        console.log(`  📄 Scraping: ${scheme.name}`);
        
        const record = await this.scrapeKnownScheme(scheme);
        if (record) {
          const recordKey = createRecordKey(record.scheme_name, record.state, record.link);
          
          if (this.duplicateKeys.has(recordKey)) {
            console.log(`    🔄 Duplicate: ${record.scheme_name}`);
            continue;
          }
          
          this.duplicateKeys.add(recordKey);
          this.scraped.push(record);
          console.log(`    ✅ ${record.scheme_name} (${record.state})`);
        }
      } catch (error) {
        this.logError(scheme.url, `Failed to scrape ${scheme.name}: ${error}`);
      }
    }
  }

  /**
   * Scrape state-specific schemes
   */
  private async scrapeStateSchemes(stateSlug: string) {
    const stateName = this.stateSlugs[stateSlug] || stateSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log(`🏛️ Scraping schemes for ${stateName}...`);
    
    const stateSchemes = STATE_PORTALS[stateSlug as keyof typeof STATE_PORTALS] || [];
    
    for (const scheme of stateSchemes) {
      try {
        await this.delay(this.options.delay!);
        console.log(`  📄 Scraping: ${scheme.name}`);
        
        const record = await this.scrapeKnownScheme({
          ...scheme,
          state: stateName
        });
        
        if (record) {
          const recordKey = createRecordKey(record.scheme_name, record.state, record.link);
          
          if (this.duplicateKeys.has(recordKey)) {
            console.log(`    🔄 Duplicate: ${record.scheme_name}`);
            continue;
          }
          
          this.duplicateKeys.add(recordKey);
          this.scraped.push(record);
          console.log(`    ✅ ${record.scheme_name} (${record.state})`);
        }
      } catch (error) {
        this.logError(scheme.url, `Failed to scrape ${scheme.name}: ${error}`);
      }
    }
  }

  /**
   * Scrape a known scheme with fallback data
   */
  private async scrapeKnownScheme(scheme: any): Promise<SchemeRecord | null> {
    try {
      // Try to fetch real data from the URL
      const html = await this.fetchPageHtml(scheme.url);
      const $ = load(html);
      
      // Try to extract real content from the page
      const extractedName = this.extractSchemeName($) || scheme.name;
      const extractedDescription = this.extractDescription($) || scheme.description;
      const extractedEligibility = this.extractEligibility($);
      
      return {
        scheme_name: normalizeSchemeName(extractedName),
        state: scheme.state,
        description_html: extractedDescription ? `<p>${extractedDescription}</p>` : null,
        description_text: normalizeText(extractedDescription),
        eligibility_html: extractedEligibility ? `<p>${extractedEligibility}</p>` : null,
        eligibility_text: normalizeText(extractedEligibility || ''),
        link: normalizeUrl(scheme.url),
        source_url: scheme.url,
        scraped_at: new Date().toISOString()
      };
    } catch (error) {
      // Fallback to known data if URL scraping fails
      console.log(`    ⚠️ Using fallback data for ${scheme.name}`);
      
      return {
        scheme_name: normalizeSchemeName(scheme.name),
        state: scheme.state,
        description_html: `<p>${scheme.description}</p>`,
        description_text: normalizeText(scheme.description),
        eligibility_html: null,
        eligibility_text: '',
        link: normalizeUrl(scheme.url),
        source_url: scheme.url,
        scraped_at: new Date().toISOString()
      };
    }
  }

  /**
   * Extract description from page
   */
  private extractDescription($: CheerioAPI): string {
    const selectors = [
      '.scheme-description',
      '.description',
      '.scheme-details',
      '.about',
      '.overview',
      '.content p',
      '.main-content p',
      'main p',
      '.page-content p',
      'p'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      for (let i = 0; i < elements.length; i++) {
        const text = $(elements[i]).text().trim();
        if (text.length > 50 && text.length < 500) {
          return text;
        }
      }
    }

    return '';
  }

  /**
   * Extract eligibility from page
   */
  private extractEligibility($: CheerioAPI): string {
    const selectors = [
      '.eligibility',
      '.scheme-eligibility', 
      '.who-can-apply',
      '.eligible',
      '[id*="eligib" i]',
      '[class*="eligib" i]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text.length > 10) {
          return text;
        }
      }
    }

    return '';
  }

  /**
   * Get list of states to scrape (legacy method - keeping for compatibility)
   */
  async getStateList(): Promise<StateInfo[]> {
    // Common government portals for schemes
    const portalUrls = [
      'https://www.india.gov.in/topics/agriculture',
      'https://www.myscheme.gov.in/',
      'https://agricoop.gov.in/en/schemes',
      'https://www.pmkisan.gov.in/',
    ];

    const states: StateInfo[] = [];

    // Add predefined states from our mapping
    for (const [slug, name] of Object.entries(this.stateSlugs)) {
      if (slug !== 'central' && slug !== 'national' && slug !== 'india') {
        states.push({
          name,
          slug,
          url: `https://www.myscheme.gov.in/schemes/${slug}` // Example URL structure
        });
      }
    }

    // Add central schemes
    states.push({
      name: 'Central',
      slug: 'central',
      url: 'https://www.india.gov.in/central-government-schemes'
    });

    return states;
  }

  /**
   * Scrape all schemes for a specific state (legacy method - updated to use new approach)
   */
  private async scrapeStateSchemesLegacy(state: StateInfo): Promise<void> {
    console.log(`🏛️ Legacy scraping for ${state.name}...`);
    // This method is kept for backward compatibility but uses the new approach
    await this.scrapeStateSchemes(state.slug);
  }

  /**
   * Scrape a scheme listing page to get individual scheme links
   */
  private async scrapeSchemeListPage(url: string, state: StateInfo): Promise<Array<{ name: string; url: string }>> {
    const schemes: Array<{ name: string; url: string }> = [];
    
    try {
      const page = await this.browser!.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': USER_AGENT
      });
      
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      if (!response?.ok()) {
        throw new Error(`HTTP ${response?.status()}: ${response?.statusText()}`);
      }

      // Common selectors for scheme links
      const selectors = [
        'a[href*="scheme"]',
        'a[href*="/schemes/"]',
        '.scheme-item a',
        '.scheme-card a',
        '.scheme-list a',
        'a[title*="scheme" i]',
        'a[title*="yojana" i]'
      ];

      for (const selector of selectors) {
        const links = await page.$$eval(selector, (elements) => 
          elements.map((el: any) => ({
            name: el.textContent?.trim() || '',
            url: el.href || ''
          })).filter(item => item.name && item.url)
        );
        
        if (links.length > 0) {
          schemes.push(...links);
          break;
        }
      }

      await page.close();
    } catch (error) {
      // Fallback to static scraping with Cheerio
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 10000
        });
        
        const $ = load(response.data);
        
        $('a[href*="scheme"], a[href*="/schemes/"]').each((_, el) => {
          const $el = $(el);
          const name = $el.text().trim();
          const href = $el.attr('href');
          
          if (name && href) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
            schemes.push({ name, url: fullUrl });
          }
        });
      } catch (fallbackError) {
        this.logError(url, `Failed both Playwright and Cheerio scraping: ${fallbackError}`);
      }
    }
    
    return this.deduplicateSchemes(schemes);
  }

  /**
   * Process individual scheme page
   */
  private async processScheme(schemeInfo: { name: string; url: string }, parentState: StateInfo): Promise<void> {
    try {
      const html = await this.fetchPageHtml(schemeInfo.url);
      const record = await this.extractSchemeFromPage(html, schemeInfo.url, parentState);
      
      if (record) {
        const recordKey = createRecordKey(record.scheme_name, record.state, record.link);
        
        if (this.duplicateKeys.has(recordKey)) {
          console.log(`    🔄 Duplicate: ${record.scheme_name} (${record.state})`);
          return;
        }
        
        this.duplicateKeys.add(recordKey);
        this.scraped.push(record);
        console.log(`    ✅ ${record.scheme_name} (${record.state})`);
      }
    } catch (error) {
      this.logError(schemeInfo.url, `Failed to process scheme: ${error}`);
    }
  }

  /**
   * Extract scheme details from individual scheme page
   */
  async extractSchemeFromPage(html: string, url: string, parentState: StateInfo): Promise<SchemeRecord | null> {
    const $ = load(html);
    
    // Extract scheme name (highest priority selectors first)
    const schemeName = this.extractSchemeName($);
    if (!schemeName) {
      throw new Error('Could not extract scheme name');
    }

    // Detect state
    const detectedState = await this.detectStateFromPage($, url, parentState);
    
    // Extract description
    const { html: descriptionHtml, text: descriptionText } = this.extractContent($, [
      '.scheme-description',
      '.description',
      '.scheme-details',
      '.content',
      '.scheme-info p',
      'main p',
      '.page-content p'
    ]);

    // Extract eligibility
    const { html: eligibilityHtml, text: eligibilityText } = this.extractContent($, [
      '.eligibility',
      '.scheme-eligibility',
      '.who-can-apply',
      '.eligible',
      '[id*="eligib" i]',
      '[class*="eligib" i]'
    ]);

    return {
      scheme_name: normalizeSchemeName(schemeName),
      state: detectedState,
      description_html: descriptionHtml ? sanitizeHtml(descriptionHtml) : null,
      description_text: normalizeText(descriptionText),
      eligibility_html: eligibilityHtml ? sanitizeHtml(eligibilityHtml) : null,
      eligibility_text: normalizeText(eligibilityText),
      link: normalizeUrl(url),
      source_url: url,
      scraped_at: new Date().toISOString()
    };
  }

  /**
   * Extract scheme name using priority-based selectors
   */
  private extractSchemeName($: CheerioAPI): string {
    const selectors = [
      'h1',
      '.scheme-title',
      '.scheme-name',
      '[role="heading"]',
      'h2',
      '.page-title',
      '.title',
      '.scheme-header h1',
      '.scheme-header h2'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }

    // Fallback to title tag
    const title = $('title').text().trim();
    if (title) {
      return title.replace(/\s*-\s*.*$/, ''); // Remove site name suffix
    }

    return '';
  }

  /**
   * Detect state from page using priority-based heuristics
   */
  async detectStateFromPage($: CheerioAPI, url: string, parentState: StateInfo): Promise<string> {
    // 1. Check explicit page metadata
    const metaState = this.checkMetadata($);
    if (metaState) return metaState;

    // 2. Check breadcrumbs
    const breadcrumbState = this.checkBreadcrumbs($);
    if (breadcrumbState) return breadcrumbState;

    // 3. Check URL segments
    const urlState = this.checkUrlSegments(url);
    if (urlState) return urlState;

    // 4. Check content labels
    const contentState = this.checkContentLabels($);
    if (contentState) return contentState;

    // 5. Check for central scheme indicators
    if (this.isCentralScheme($, url)) {
      return 'Central';
    }

    // 6. Fallback to parent state
    return parentState.name;
  }

  private checkMetadata($: CheerioAPI): string | null {
    const selectors = [
      'meta[name="state"]',
      'meta[property="og:site_name"]',
      'meta[name="DC.publisher"]'
    ];

    for (const selector of selectors) {
      const content = $(selector).attr('content');
      if (content) {
        const state = this.mapSlugToState(content);
        if (state) return state;
      }
    }

    // Check JSON-LD
    let foundState: string | undefined;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        if (data.addressRegion || data.areaServed) {
          const region = data.addressRegion || data.areaServed;
          const state = this.mapSlugToState(region);
          if (state) {
            foundState = state;
            return false; // Break out of loop
          }
        }
      } catch {}
    });

    return foundState || null;
  }

  private checkBreadcrumbs($: CheerioAPI): string | null {
    const breadcrumbSelectors = [
      '.breadcrumb',
      '.breadcrumbs',
      '[aria-label="breadcrumb"]',
      '.navigation-path'
    ];

    for (const selector of breadcrumbSelectors) {
      const breadcrumb = $(selector).text();
      const stateMatch = breadcrumb.match(/(?:Home|Schemes?)\s*[>›]\s*([^>›]+)/i);
      if (stateMatch) {
        const state = this.mapSlugToState(stateMatch[1]);
        if (state) return state;
      }
    }

    return null;
  }

  private checkUrlSegments(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      
      for (const segment of segments) {
        const state = this.mapSlugToState(segment);
        if (state && state !== 'Central') return state;
      }
    } catch {}
    
    return null;
  }

  private checkContentLabels($: CheerioAPI): string | null {
    const text = $.text();
    const patterns = [
      /State:\s*([^,\n]+)/i,
      /Applicable in:\s*([^,\n]+)/i,
      /State \/ UT:\s*([^,\n]+)/i,
      /Location:\s*([^,\n]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const state = this.mapSlugToState(match[1]);
        if (state) return state;
      }
    }

    return null;
  }

  private isCentralScheme($: CheerioAPI, url: string): boolean {
    const text = $.text().toLowerCase();
    const urlLower = url.toLowerCase();
    
    const centralIndicators = [
      'central government',
      'ministry of',
      'government of india',
      'national scheme',
      'central scheme',
      'all india',
      'nationwide'
    ];

    const centralDomains = [
      'india.gov.in',
      'gov.in/ministry',
      'pmindia.gov.in',
      'pmkisan.gov.in'
    ];

    return centralIndicators.some(indicator => text.includes(indicator)) ||
           centralDomains.some(domain => urlLower.includes(domain));
  }

  private mapSlugToState(input: string): string | null {
    if (!input) return null;
    
    const cleaned = input.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    return this.stateSlugs[cleaned] || null;
  }

  /**
   * Extract content (both HTML and text) using priority selectors
   */
  private extractContent($: CheerioAPI, selectors: string[]): { html: string; text: string } {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const html = element.html() || '';
        const text = htmlToText(html);
        if (text.trim()) {
          return { html, text };
        }
      }
    }
    return { html: '', text: '' };
  }

  /**
   * Find next page URL for pagination
   */
  private async findNextPage(currentUrl: string): Promise<string | null> {
    try {
      const page = await this.browser!.newPage();
      await page.goto(currentUrl);
      
      // Look for next page links
      const nextSelectors = [
        'a[rel="next"]',
        'a:contains("Next")',
        'a:contains(">")',
        'a:contains("More")',
        '.pagination a[href]:last-child'
      ];

      for (const selector of nextSelectors) {
        const nextLink = await page.$eval(selector, el => (el as HTMLAnchorElement).href).catch(() => null);
        if (nextLink && !this.visitedUrls.has(nextLink)) {
          await page.close();
          return nextLink;
        }
      }

      await page.close();
    } catch {}
    
    return null;
  }

  /**
   * Fetch page HTML with retries
   */
  private async fetchPageHtml(url: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.maxRetries!; attempt++) {
      try {
        // Try Playwright first for JS-heavy pages
        const page = await this.browser!.newPage();
        await page.setExtraHTTPHeaders({
          'User-Agent': USER_AGENT
        });
        
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (response?.ok()) {
          const html = await page.content();
          await page.close();
          return html;
        }
        await page.close();
        
        // Fallback to axios
        const axiosResponse = await axios.get(url, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 15000
        });
        
        return axiosResponse.data;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.options.maxRetries!) {
          await this.delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch page');
  }

  // Utility methods
  private deduplicateSchemes(schemes: Array<{ name: string; url: string }>): Array<{ name: string; url: string }> {
    const seen = new Set<string>();
    return schemes.filter(scheme => {
      const key = `${scheme.name}|${normalizeUrl(scheme.url)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(url: string, error: string) {
    const errorEntry = {
      url,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.errors.push(errorEntry);
    console.error(`❌ Error scraping ${url}: ${error}`);
  }

  private async saveLogs() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Save errors log
    if (this.errors.length > 0) {
      const errorsPath = path.join(__dirname, `../logs/errors-${timestamp}.json`);
      await fs.writeFile(errorsPath, JSON.stringify(this.errors, null, 2));
      console.log(`📝 Errors logged to: ${errorsPath}`);
    }
    
    // Save duplicates log
    if (this.duplicateKeys.size > 0) {
      const duplicatesPath = path.join(__dirname, `../logs/duplicates-${timestamp}.log`);
      const duplicatesContent = Array.from(this.duplicateKeys).join('\n');
      await fs.writeFile(duplicatesPath, duplicatesContent);
      console.log(`🔄 Duplicates logged to: ${duplicatesPath}`);
    }
  }

  /**
   * Save results to JSON file
   */
  async saveToJson(filename: string): Promise<void> {
    const filepath = path.resolve(filename);
    await fs.writeFile(filepath, JSON.stringify(this.scraped, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
  }

  /**
   * Save results to Supabase
   */
  async saveToSupabase(): Promise<void> {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables required');
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    console.log(`📤 Upserting ${this.scraped.length} schemes to Supabase...`);
    
    const batchSize = 100;
    let upserted = 0;
    
    for (let i = 0; i < this.scraped.length; i += batchSize) {
      const batch = this.scraped.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('welfare_schemes')
        .upsert(batch, {
          onConflict: 'scheme_name,state,link'
        });
      
      if (error) {
        console.error('❌ Supabase upsert error:', error);
        throw error;
      }
      
      upserted += batch.length;
      console.log(`  ✅ Upserted ${upserted}/${this.scraped.length} schemes`);
    }
    
    console.log('🎉 Successfully saved all schemes to Supabase!');
  }
}

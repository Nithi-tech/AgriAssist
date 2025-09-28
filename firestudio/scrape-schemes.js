const puppeteer = require('puppeteer');
const fs = require('fs');
const { SchemeDataCleaner } = require('./clean-schemes-data');

/**
 * Government Schemes Web Scraper
 * Scrapes schemes data from localhost and cleans it automatically
 */

class GovernmentSchemesScraper {
    constructor() {
        this.cleaner = new SchemeDataCleaner();
        this.baseUrl = 'http://localhost:9005/government-schemes/';
    }

    /**
     * Launch browser and navigate to schemes page
     */
    async initBrowser() {
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for production
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        this.page = await this.browser.newPage();
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
    }

    /**
     * Scrape schemes data from the table
     */
    async scrapeSchemes() {
        console.log('🕷️  Scraping schemes data from page...');

        // Wait for the table to load
        await this.page.waitForSelector('table', { timeout: 10000 });

        // Extract data from the table
        const schemes = await this.page.evaluate(() => {
            const rows = document.querySelectorAll('table tbody tr');
            const data = [];

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    data.push({
                        scheme_name: cells[0]?.innerText?.trim() || '',
                        state: cells[1]?.innerText?.trim() || '',
                        eligibility: cells[2]?.innerText?.trim() || '',
                        category: cells[3]?.innerText?.trim() || '',
                        benefit_amount: cells[4]?.innerText?.trim() || ''
                    });
                }
            });

            return data;
        });

        console.log(`📊 Found ${schemes.length} schemes to process`);
        return schemes;
    }

    /**
     * Scrape and clean all schemes data
     */
    async scrapeAndClean() {
        try {
            await this.initBrowser();
            
            // Scrape raw data
            const rawSchemes = await this.scrapeSchemes();
            
            // Clean the data
            console.log('🧹 Cleaning scraped data...');
            const cleanedSchemes = this.cleaner.processSchemes(rawSchemes);
            
            // Save raw data
            const rawFilePath = 'scraped-schemes-raw.json';
            fs.writeFileSync(rawFilePath, JSON.stringify(rawSchemes, null, 2));
            console.log(`💾 Raw data saved to: ${rawFilePath}`);
            
            // Save cleaned data
            const cleanFilePath = 'scraped-schemes-clean.json';
            fs.writeFileSync(cleanFilePath, JSON.stringify(cleanedSchemes, null, 2));
            console.log(`✨ Cleaned data saved to: ${cleanFilePath}`);
            
            // Show comparison
            console.log('\n📋 Sample Comparison:');
            console.log('RAW DATA:');
            console.log(JSON.stringify(rawSchemes.slice(0, 2), null, 2));
            console.log('\nCLEANED DATA:');
            console.log(JSON.stringify(cleanedSchemes.slice(0, 2), null, 2));
            
            await this.browser.close();
            return cleanedSchemes;
            
        } catch (error) {
            console.error('❌ Error during scraping:', error.message);
            if (this.browser) {
                await this.browser.close();
            }
            throw error;
        }
    }

    /**
     * Scrape specific page or with pagination
     */
    async scrapeWithPagination() {
        try {
            await this.initBrowser();
            let allSchemes = [];
            let pageNum = 1;

            while (true) {
                console.log(`📄 Processing page ${pageNum}...`);
                
                const schemes = await this.scrapeSchemes();
                if (schemes.length === 0) {
                    console.log('No more schemes found. Stopping pagination.');
                    break;
                }
                
                allSchemes = [...allSchemes, ...schemes];
                
                // Try to find next page button
                const nextButton = await this.page.$('button[aria-label="Next page"]');
                if (!nextButton) {
                    console.log('No next page button found. Stopping pagination.');
                    break;
                }
                
                // Click next page
                await nextButton.click();
                await this.page.waitForTimeout(2000); // Wait for page to load
                pageNum++;
            }

            console.log(`🎉 Total schemes scraped: ${allSchemes.length}`);
            
            // Clean all data
            const cleanedSchemes = this.cleaner.processSchemes(allSchemes);
            
            // Save files
            fs.writeFileSync('all-schemes-raw.json', JSON.stringify(allSchemes, null, 2));
            fs.writeFileSync('all-schemes-clean.json', JSON.stringify(cleanedSchemes, null, 2));
            
            await this.browser.close();
            return cleanedSchemes;
            
        } catch (error) {
            console.error('❌ Error during pagination scraping:', error.message);
            if (this.browser) {
                await this.browser.close();
            }
            throw error;
        }
    }
}

// Manual data processing for your current visible data
function processVisibleData() {
    // Based on your screenshot, here's the data I can see:
    const visibleData = [
        {
            scheme_name: "BackFilter ByFilter ByReset FiltersStateSelectSchemeCategorySocial welfare & Empowerme",
            state: "India",
            eligibility: "Search: welfare",
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "tly AbledDBT SchemeBelow Poverty Li",
            state: "India", 
            eligibility: "Search: urban",
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "tReset FiltersCloseFilter ByReset FiltersStateSelectSchemeCategorySocial welfare & Empowerme",
            state: "India",
            eligibility: "Search: urban", 
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "quotes. For example: \"Scheme",
            state: "India",
            eligibility: "Search: welfare",
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "ame\".All SchemesState SchemesCe",
            state: "India",
            eligibility: "Search: welfare",
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "tral SchemesSortFilterTotal 3839 schemes availableSortReleva",
            state: "India",
            eligibility: "Search: welfare",
            category: "",
            benefit_amount: "Not specified"
        },
        {
            scheme_name: "ame (A→Z)Scheme",
            state: "India",
            eligibility: "Search: welfare",
            category: "",
            benefit_amount: "Not specified"
        }
    ];

    const cleaner = new SchemeDataCleaner();
    const cleaned = cleaner.processSchemes(visibleData);
    
    console.log('🧹 Processed visible data from screenshot:');
    console.log(JSON.stringify(cleaned, null, 2));
    
    // Save the cleaned visible data
    fs.writeFileSync('visible-schemes-clean.json', JSON.stringify(cleaned, null, 2));
    console.log('💾 Saved to: visible-schemes-clean.json');
    
    return cleaned;
}

// Usage
if (require.main === module) {
    console.log('🕷️  Government Schemes Scraper & Cleaner');
    console.log('==========================================\n');

    const args = process.argv.slice(2);
    const command = args[0] || 'visible';

    switch (command) {
        case 'scrape':
            console.log('🌐 Starting web scraping...');
            const scraper = new GovernmentSchemesScraper();
            scraper.scrapeAndClean()
                .then(data => {
                    console.log(`\n🎉 Successfully processed ${data.length} schemes!`);
                })
                .catch(err => console.error('❌ Scraping failed:', err.message));
            break;

        case 'paginate':
            console.log('📄 Starting pagination scraping...');
            const paginationScraper = new GovernmentSchemesScraper();
            paginationScraper.scrapeWithPagination()
                .then(data => {
                    console.log(`\n🎉 Successfully processed ${data.length} schemes with pagination!`);
                })
                .catch(err => console.error('❌ Pagination scraping failed:', err.message));
            break;

        case 'visible':
        default:
            console.log('👀 Processing visible data from screenshot...');
            processVisibleData();
            break;
    }

    console.log('\n📋 Usage:');
    console.log('  node scrape-schemes.js visible    # Process visible data from screenshot');
    console.log('  node scrape-schemes.js scrape     # Scrape current page');
    console.log('  node scrape-schemes.js paginate   # Scrape all pages with pagination');
}

module.exports = { GovernmentSchemesScraper };

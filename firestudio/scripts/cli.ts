#!/usr/bin/env node

import { Command } from 'commander';
import { SchemeScraper, ScrapingOptions } from './scrapeSchemes';

async function main() {
  const program = new Command();
  
  program
    .name('scrape-schemes')
    .description('Government schemes scraper with multi-state support')
    .version('1.0.0');

  program
    .option('--states <states>', 'Comma-separated list of state slugs (e.g., karnataka,tamil-nadu) or "all"')
    .option('--save-json <filename>', 'Save results to JSON file')
    .option('--save-to-supabase', 'Save results to Supabase database')
    .option('--dry-run', 'Output JSON but do not save to database')
    .option('--concurrency <number>', 'Number of concurrent requests', '3')
    .option('--delay <number>', 'Delay between requests in milliseconds', '400')
    .option('--max-retries <number>', 'Maximum retry attempts for failed requests', '3');

  program.action(async (options) => {
    console.log('🚀 Government Schemes Scraper v1.0.0\n');

    const scrapingOptions: ScrapingOptions = {
      states: options.states === 'all' ? undefined : options.states?.split(',').map((s: string) => s.trim()),
      saveJson: options.saveJson,
      saveToSupabase: options.saveToSupabase && !options.dryRun,
      dryRun: options.dryRun,
      concurrency: parseInt(options.concurrency),
      delay: parseInt(options.delay),
      maxRetries: parseInt(options.maxRetries)
    };

    console.log('⚙️ Configuration:');
    console.log('  States:', scrapingOptions.states || 'Default (first 2 for testing)');
    console.log('  Concurrency:', scrapingOptions.concurrency);
    console.log('  Delay:', scrapingOptions.delay + 'ms');
    console.log('  Max Retries:', scrapingOptions.maxRetries);
    console.log('  Dry Run:', scrapingOptions.dryRun ? 'Yes' : 'No');
    console.log('  Save to JSON:', scrapingOptions.saveJson || 'No');
    console.log('  Save to Supabase:', scrapingOptions.saveToSupabase ? 'Yes' : 'No');
    console.log();

    try {
      const scraper = new SchemeScraper(scrapingOptions);
      const results = await scraper.scrape();

      // Save results
      if (scrapingOptions.saveJson) {
        await scraper.saveToJson(scrapingOptions.saveJson);
      }

      if (scrapingOptions.saveToSupabase) {
        await scraper.saveToSupabase();
      }

      // Print summary
      console.log('\n📊 SCRAPING SUMMARY:');
      console.log('='.repeat(50));
      console.log(`Total schemes found: ${results.length}`);
      
      const stateGroups = results.reduce((acc, scheme) => {
        acc[scheme.state] = (acc[scheme.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('\nSchemes by state:');
      Object.entries(stateGroups)
        .sort(([,a], [,b]) => b - a)
        .forEach(([state, count]) => {
          console.log(`  ${state}: ${count} schemes`);
        });

      if (scrapingOptions.dryRun) {
        console.log('\n🎯 DRY RUN - Sample results:');
        console.log(JSON.stringify(results.slice(0, 3), null, 2));
      }

      console.log('\n✅ Scraping completed successfully!');
    } catch (error) {
      console.error('\n❌ Scraping failed:', error);
      process.exit(1);
    }
  });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main().catch(console.error);
}

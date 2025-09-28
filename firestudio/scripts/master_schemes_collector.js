const { EnhancedSchemesScraper } = require('./enhanced_schemes_scraper');
const { GovernmentAPICollector } = require('./government_api_collector');
const fs = require('fs').promises;
const path = require('path');

class MasterSchemesCollector {
  constructor() {
    this.allSchemes = new Map();
    this.stats = {
      totalFromAPI: 0,
      totalFromScraping: 0,
      totalUnique: 0,
      duplicatesRemoved: 0,
      startTime: Date.now(),
      endTime: null
    };
  }

  async runComprehensiveCollection() {
    console.log('🎯 Starting COMPREHENSIVE Government Schemes Collection');
    console.log('='.repeat(60));

    try {
      // Phase 1: Try API Collection first
      console.log('\n📡 PHASE 1: API Collection');
      console.log('-'.repeat(30));
      
      const apiCollector = new GovernmentAPICollector();
      const apiSchemes = await apiCollector.run();
      
      this.stats.totalFromAPI = apiSchemes.length;
      console.log(`✅ API Collection: ${apiSchemes.length} schemes`);

      // Add API schemes to master collection
      apiSchemes.forEach(scheme => this.addScheme(scheme, 'API'));

      // Phase 2: Enhanced Web Scraping
      console.log('\n🔍 PHASE 2: Enhanced Web Scraping');
      console.log('-'.repeat(30));
      
      const webScraper = new EnhancedSchemesScraper();
      const scrapedSchemes = await webScraper.run();
      
      this.stats.totalFromScraping = scrapedSchemes.length;
      console.log(`✅ Web Scraping: ${scrapedSchemes.length} schemes`);

      // Add scraped schemes to master collection
      scrapedSchemes.forEach(scheme => this.addScheme(scheme, 'SCRAPING'));

      // Phase 3: Consolidate and Save
      console.log('\n💾 PHASE 3: Consolidation & Save');
      console.log('-'.repeat(30));
      
      await this.consolidateAndSave();

      this.stats.endTime = Date.now();
      const duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);

      console.log('\n🎉 COLLECTION COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`📊 Final Stats:`);
      console.log(`   • API Schemes: ${this.stats.totalFromAPI}`);
      console.log(`   • Scraped Schemes: ${this.stats.totalFromScraping}`);
      console.log(`   • Unique Schemes: ${this.stats.totalUnique}`);
      console.log(`   • Duplicates Removed: ${this.stats.duplicatesRemoved}`);
      console.log(`   • Duration: ${duration} seconds`);

    } catch (error) {
      console.error('❌ Master collection failed:', error);
      throw error;
    }
  }

  addScheme(scheme, source) {
    if (!scheme.scheme_name) return;

    const key = this.generateKey(scheme);
    
    if (this.allSchemes.has(key)) {
      // Scheme already exists, merge data
      const existing = this.allSchemes.get(key);
      const merged = this.mergeSchemes(existing, scheme, source);
      this.allSchemes.set(key, merged);
      this.stats.duplicatesRemoved++;
    } else {
      // New scheme
      this.allSchemes.set(key, {
        ...scheme,
        sources: [source],
        consolidated_at: new Date().toISOString()
      });
    }

    this.stats.totalUnique = this.allSchemes.size;
  }

  generateKey(scheme) {
    // Create a more intelligent key for better duplicate detection
    const name = this.normalizeForKey(scheme.scheme_name);
    const state = this.normalizeForKey(scheme.state);
    return `${name}-${state}`;
  }

  normalizeForKey(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/scheme|yojana|program|programme/g, '') // Remove common words
      .trim();
  }

  mergeSchemes(existing, newScheme, source) {
    // Intelligent merging - take the most complete data
    return {
      id: existing.id,
      scheme_name: this.chooseBest(existing.scheme_name, newScheme.scheme_name, 'length'),
      state: this.chooseBest(existing.state, newScheme.state, 'completeness'),
      category: this.chooseBest(existing.category, newScheme.category, 'completeness'),
      eligibility: this.chooseBest(existing.eligibility, newScheme.eligibility, 'length'),
      explanation: this.chooseBest(existing.explanation, newScheme.explanation, 'length'),
      benefit_amount: existing.benefit_amount || newScheme.benefit_amount,
      link: this.chooseBest(existing.link, newScheme.link, 'validity'),
      source_url: existing.source_url + '; ' + (newScheme.source_url || ''),
      sources: [...(existing.sources || []), source],
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      consolidated_at: new Date().toISOString()
    };
  }

  chooseBest(existing, newValue, criteria) {
    if (!existing && newValue) return newValue;
    if (existing && !newValue) return existing;
    if (!existing && !newValue) return null;

    switch (criteria) {
      case 'length':
        return existing.length >= newValue.length ? existing : newValue;
      case 'completeness':
        // Prefer values that are not 'Unknown' or generic
        if (existing.toLowerCase().includes('unknown') && !newValue.toLowerCase().includes('unknown')) {
          return newValue;
        }
        return existing;
      case 'validity':
        // For URLs, prefer https over http, prefer .gov.in domains
        if (newValue && newValue.includes('https://') && newValue.includes('.gov.in')) {
          return newValue;
        }
        return existing;
      default:
        return existing;
    }
  }

  async consolidateAndSave() {
    const finalSchemes = Array.from(this.allSchemes.values());
    
    // Enrich schemes with additional metadata
    const enrichedSchemes = finalSchemes.map(scheme => ({
      ...scheme,
      data_quality_score: this.calculateQualityScore(scheme),
      completeness_percentage: this.calculateCompleteness(scheme)
    }));

    // Sort by quality score (highest first)
    enrichedSchemes.sort((a, b) => b.data_quality_score - a.data_quality_score);

    const outputData = {
      schemes: enrichedSchemes,
      meta: {
        total_schemes: enrichedSchemes.length,
        unique_states: [...new Set(enrichedSchemes.map(s => s.state))].length,
        unique_categories: [...new Set(enrichedSchemes.map(s => s.category).filter(Boolean))].length,
        collection_methods: ['Government APIs', 'Web Scraping'],
        last_updated: new Date().toISOString(),
        stats: this.stats,
        quality_metrics: {
          high_quality: enrichedSchemes.filter(s => s.data_quality_score >= 80).length,
          medium_quality: enrichedSchemes.filter(s => s.data_quality_score >= 60 && s.data_quality_score < 80).length,
          low_quality: enrichedSchemes.filter(s => s.data_quality_score < 60).length,
          average_completeness: Math.round(
            enrichedSchemes.reduce((sum, s) => sum + s.completeness_percentage, 0) / enrichedSchemes.length
          )
        }
      }
    };

    // Save master JSON file
    await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
    await fs.writeFile(
      path.join(__dirname, '../data/welfare_schemes.json'),
      JSON.stringify(outputData, null, 2)
    );

    // Save high-quality subset
    const highQualitySchemes = enrichedSchemes.filter(s => s.data_quality_score >= 70);
    await fs.writeFile(
      path.join(__dirname, '../data/welfare_schemes_high_quality.json'),
      JSON.stringify({
        ...outputData,
        schemes: highQualitySchemes,
        meta: {
          ...outputData.meta,
          total_schemes: highQualitySchemes.length,
          filter_applied: 'High Quality Only (Score >= 70)'
        }
      }, null, 2)
    );

    // Save detailed log
    await fs.writeFile(
      path.join(__dirname, '../data/collection_log.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: this.stats,
        summary: {
          total_unique_schemes: enrichedSchemes.length,
          data_sources_used: ['APIs', 'Web Scraping'],
          quality_distribution: outputData.meta.quality_metrics
        }
      }, null, 2)
    );

    console.log(`💾 Saved ${enrichedSchemes.length} schemes to welfare_schemes.json`);
    console.log(`🎯 Saved ${highQualitySchemes.length} high-quality schemes to welfare_schemes_high_quality.json`);
    
    return enrichedSchemes;
  }

  calculateQualityScore(scheme) {
    let score = 0;
    const weights = {
      scheme_name: 20,
      state: 15,
      category: 10,
      eligibility: 20,
      explanation: 20,
      benefit_amount: 5,
      link: 10
    };

    // Check each field
    if (scheme.scheme_name && scheme.scheme_name.length > 10) score += weights.scheme_name;
    if (scheme.state && !scheme.state.toLowerCase().includes('unknown')) score += weights.state;
    if (scheme.category && scheme.category.length > 5) score += weights.category;
    if (scheme.eligibility && scheme.eligibility.length > 20) score += weights.eligibility;
    if (scheme.explanation && scheme.explanation.length > 50) score += weights.explanation;
    if (scheme.benefit_amount && scheme.benefit_amount > 0) score += weights.benefit_amount;
    if (scheme.link && scheme.link.includes('.gov.in')) score += weights.link;

    // Bonus for multiple sources
    if (scheme.sources && scheme.sources.length > 1) score += 5;

    return score;
  }

  calculateCompleteness(scheme) {
    const fields = ['scheme_name', 'state', 'category', 'eligibility', 'explanation', 'benefit_amount', 'link'];
    const filledFields = fields.filter(field => {
      const value = scheme[field];
      return value && value !== 'Unknown' && value !== '';
    }).length;

    return Math.round((filledFields / fields.length) * 100);
  }
}

// Run master collection if called directly
if (require.main === module) {
  const masterCollector = new MasterSchemesCollector();
  masterCollector.runComprehensiveCollection().catch(console.error);
}

module.exports = { MasterSchemesCollector };

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class GovernmentAPICollector {
  constructor() {
    this.schemes = new Map();
    this.stats = {
      totalAPIsChecked: 0,
      successfulAPIs: 0,
      totalSchemes: 0,
      errors: 0
    };
    this.errors = [];
  }

  // Known government APIs for welfare schemes
  getAPIEndpoints() {
    return [
      {
        name: 'Data.gov.in - Central Schemes',
        url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
        params: {
          'api-key': process.env.DATA_GOV_API_KEY || 'demo-key',
          format: 'json',
          limit: 10000
        },
        transform: this.transformDataGovSchemes.bind(this)
      },
      {
        name: 'MyScheme.gov.in API',
        url: 'https://www.myscheme.gov.in/api/schemes',
        params: { limit: 5000 },
        transform: this.transformMySchemeAPI.bind(this)
      },
      {
        name: 'DBT Portal API',
        url: 'https://dbtbharat.gov.in/api/schemes',
        params: { state: 'all', limit: 5000 },
        transform: this.transformDBTSchemes.bind(this)
      },
      {
        name: 'Jan Aushadhi Portal',
        url: 'https://janaushadhi.gov.in/api/schemes',
        params: {},
        transform: this.transformJanAushadhiSchemes.bind(this)
      },
      {
        name: 'NRLM Portal',
        url: 'https://aajeevika.gov.in/api/schemes',
        params: { category: 'all' },
        transform: this.transformNRLMSchemes.bind(this)
      }
    ];
  }

  async fetchFromAPI(endpoint) {
    const { name, url, params, transform } = endpoint;
    console.log(`📡 Fetching from ${name}...`);
    
    try {
      const urlWithParams = new URL(url);
      Object.keys(params).forEach(key => {
        urlWithParams.searchParams.append(key, params[key]);
      });

      const response = await fetch(urlWithParams.toString(), {
        headers: {
          'User-Agent': 'Government-Schemes-Collector/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ${name} responded with data structure:`, Object.keys(data));
      
      const schemes = await transform(data);
      
      if (schemes.length > 0) {
        this.stats.successfulAPIs++;
        schemes.forEach(scheme => this.addScheme(scheme));
        console.log(`📊 ${name}: Added ${schemes.length} schemes`);
      }
      
      return schemes;
      
    } catch (error) {
      console.error(`❌ ${name} failed:`, error.message);
      this.errors.push({ api: name, error: error.message });
      this.stats.errors++;
      return [];
    }
  }

  // Transform functions for different API formats
  transformDataGovSchemes(data) {
    const records = data.records || data.data || data;
    if (!Array.isArray(records)) return [];

    return records.map(record => ({
      scheme_name: this.normalizeText(record.scheme_name || record.name || record.title),
      state: this.normalizeText(record.state || record.location || 'Central'),
      category: this.normalizeText(record.category || record.sector || 'Government Scheme'),
      eligibility: this.normalizeText(record.eligibility || record.target_group),
      explanation: this.normalizeText(record.description || record.objective),
      benefit_amount: this.extractAmount(record.benefit_amount || record.amount),
      link: record.website || record.url || record.portal_link,
      source_url: 'data.gov.in',
      ministry: this.normalizeText(record.ministry || record.department)
    })).filter(scheme => scheme.scheme_name);
  }

  transformMySchemeAPI(data) {
    const schemes = data.schemes || data.data || data.results || data;
    if (!Array.isArray(schemes)) return [];

    return schemes.map(scheme => ({
      scheme_name: this.normalizeText(scheme.scheme_name || scheme.name),
      state: this.normalizeText(scheme.state || scheme.implementing_state || 'All India'),
      category: this.normalizeText(scheme.category || scheme.scheme_type),
      eligibility: this.normalizeText(scheme.eligibility_criteria || scheme.eligibility),
      explanation: this.normalizeText(scheme.brief_description || scheme.description),
      benefit_amount: this.extractAmount(scheme.benefit_details || scheme.financial_assistance),
      link: scheme.application_link || scheme.official_url,
      source_url: 'myscheme.gov.in',
      launch_date: scheme.launch_date
    })).filter(scheme => scheme.scheme_name);
  }

  transformDBTSchemes(data) {
    const schemes = data.schemes || data.beneficiary_schemes || data;
    if (!Array.isArray(schemes)) return [];

    return schemes.map(scheme => ({
      scheme_name: this.normalizeText(scheme.scheme_name || scheme.name),
      state: this.normalizeText(scheme.state_name || scheme.state),
      category: 'Direct Benefit Transfer',
      eligibility: this.normalizeText(scheme.eligibility || scheme.target_beneficiaries),
      explanation: this.normalizeText(scheme.scheme_description || scheme.objective),
      benefit_amount: this.extractAmount(scheme.benefit_amount || scheme.subsidy_amount),
      link: scheme.portal_link || scheme.application_url,
      source_url: 'dbtbharat.gov.in',
      ministry: this.normalizeText(scheme.ministry_name)
    })).filter(scheme => scheme.scheme_name);
  }

  transformJanAushadhiSchemes(data) {
    // Health-related schemes
    const schemes = data.health_schemes || data.schemes || data;
    if (!Array.isArray(schemes)) return [];

    return schemes.map(scheme => ({
      scheme_name: this.normalizeText(scheme.scheme_name || scheme.program_name),
      state: this.normalizeText(scheme.state || 'All India'),
      category: 'Health & Medicine',
      eligibility: this.normalizeText(scheme.eligibility || 'All Citizens'),
      explanation: this.normalizeText(scheme.description || scheme.objective),
      benefit_amount: this.extractAmount(scheme.coverage_amount),
      link: scheme.enrollment_link || scheme.website,
      source_url: 'janaushadhi.gov.in'
    })).filter(scheme => scheme.scheme_name);
  }

  transformNRLMSchemes(data) {
    // Rural livelihood schemes
    const schemes = data.rural_schemes || data.livelihood_programs || data;
    if (!Array.isArray(schemes)) return [];

    return schemes.map(scheme => ({
      scheme_name: this.normalizeText(scheme.program_name || scheme.scheme_name),
      state: this.normalizeText(scheme.state || scheme.implementation_area),
      category: 'Rural Development & Livelihood',
      eligibility: this.normalizeText(scheme.target_group || scheme.beneficiaries),
      explanation: this.normalizeText(scheme.program_details || scheme.description),
      benefit_amount: this.extractAmount(scheme.financial_assistance || scheme.loan_amount),
      link: scheme.application_portal || scheme.more_info_url,
      source_url: 'aajeevika.gov.in'
    })).filter(scheme => scheme.scheme_name);
  }

  // Additional APIs for comprehensive coverage
  async fetchAdditionalAPIs() {
    const additionalAPIs = [
      {
        name: 'PM Modi Schemes API',
        url: 'https://www.pmindia.gov.in/api/schemes',
        transform: this.transformPMSchemes.bind(this)
      },
      {
        name: 'Ministry of Agriculture API',
        url: 'https://agricoop.nic.in/api/farmer-schemes',
        transform: this.transformAgricultureSchemes.bind(this)
      },
      {
        name: 'Women & Child Development',
        url: 'https://wcd.nic.in/api/schemes',
        transform: this.transformWCDSchemes.bind(this)
      }
    ];

    for (const api of additionalAPIs) {
      try {
        await this.fetchFromAPI(api);
      } catch (error) {
        console.log(`Additional API ${api.name} failed:`, error.message);
      }
    }
  }

  // Comprehensive state-wise data collection
  async fetchStateWiseData() {
    const states = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    console.log('🗺️ Fetching state-wise scheme data...');

    for (const state of states) {
      try {
        await this.fetchStateSpecificSchemes(state);
      } catch (error) {
        console.error(`Error fetching schemes for ${state}:`, error.message);
      }
    }
  }

  async fetchStateSpecificSchemes(state) {
    const stateAPIs = [
      {
        url: `https://api.data.gov.in/resource/state-schemes`,
        params: { 
          'api-key': process.env.DATA_GOV_API_KEY || 'demo-key',
          'filters[state]': state,
          limit: 1000
        }
      }
    ];

    for (const api of stateAPIs) {
      try {
        const response = await fetch(api.url + '?' + new URLSearchParams(api.params));
        if (response.ok) {
          const data = await response.json();
          const schemes = this.transformDataGovSchemes(data);
          schemes.forEach(scheme => {
            scheme.state = state;
            this.addScheme(scheme);
          });
        }
      } catch (error) {
        console.log(`State API for ${state} failed:`, error.message);
      }
    }
  }

  addScheme(scheme) {
    if (!scheme.scheme_name) return;

    const key = `${scheme.scheme_name.toLowerCase()}-${scheme.state.toLowerCase()}`;
    
    // Add unique ID and timestamps
    const enrichedScheme = {
      id: this.generateId(),
      ...scheme,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scraped_at: new Date().toISOString()
    };

    this.schemes.set(key, enrichedScheme);
    this.stats.totalSchemes = this.schemes.size;
  }

  // Utility functions
  normalizeText(text) {
    return text?.trim()?.replace(/\s+/g, ' ')?.slice(0, 1000) || '';
  }

  extractAmount(text) {
    if (!text) return null;
    if (typeof text === 'number') return text;
    
    const matches = String(text).match(/(\d+(?:,\d+)*(?:\.\d+)?)/g);
    if (matches) {
      return parseInt(matches[0].replace(/,/g, ''));
    }
    return null;
  }

  generateId() {
    return 'api-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  async saveResults() {
    const allSchemes = Array.from(this.schemes.values());
    
    console.log(`\n📊 API Collection Summary:`);
    console.log(`Total APIs checked: ${this.stats.totalAPIsChecked}`);
    console.log(`Successful APIs: ${this.stats.successfulAPIs}`);
    console.log(`Total unique schemes: ${allSchemes.length}`);
    console.log(`Errors: ${this.stats.errors}`);

    if (allSchemes.length === 0) {
      console.log('⚠️ No schemes collected from APIs');
      return;
    }

    try {
      // Save to JSON file
      const outputData = {
        schemes: allSchemes,
        meta: {
          total_schemes: allSchemes.length,
          unique_states: [...new Set(allSchemes.map(s => s.state))].length,
          unique_categories: [...new Set(allSchemes.map(s => s.category).filter(Boolean))].length,
          last_updated: new Date().toISOString(),
          collection_method: 'Government APIs',
          stats: this.stats
        }
      };

      await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
      
      await fs.writeFile(
        path.join(__dirname, '../data/welfare_schemes.json'),
        JSON.stringify(outputData, null, 2)
      );

      // Save to Supabase
      await this.saveToSupabase(allSchemes);

      console.log('✅ Results saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving results:', error);
      throw error;
    }
  }

  async saveToSupabase(schemes) {
    try {
      console.log('💾 Saving to Supabase database...');
      
      // Batch insert in chunks of 1000
      const chunkSize = 1000;
      for (let i = 0; i < schemes.length; i += chunkSize) {
        const chunk = schemes.slice(i, i + chunkSize);
        
        const { error } = await supabase
          .from('welfare_schemes')
          .upsert(chunk, {
            onConflict: 'scheme_name,state',
            ignoreDuplicates: false
          });

        if (error) {
          throw new Error(`Supabase batch ${Math.floor(i/chunkSize) + 1} failed: ${error.message}`);
        }
        
        console.log(`✅ Saved batch ${Math.floor(i/chunkSize) + 1}/${Math.ceil(schemes.length/chunkSize)}`);
      }

      console.log('🎉 All data successfully saved to Supabase!');
      
    } catch (error) {
      console.error('❌ Supabase save error:', error);
      this.errors.push({ type: 'DATABASE', error: error.message });
    }
  }

  async run() {
    console.log('🚀 Starting Government API Collection...');

    // Get main API endpoints
    const endpoints = this.getAPIEndpoints();
    this.stats.totalAPIsChecked = endpoints.length;

    // Fetch from all main APIs
    for (const endpoint of endpoints) {
      await this.fetchFromAPI(endpoint);
    }

    // Fetch additional APIs
    await this.fetchAdditionalAPIs();

    // Fetch state-wise data
    await this.fetchStateWiseData();

    // Save all results
    await this.saveResults();

    console.log('🎉 API collection completed successfully!');
    return Array.from(this.schemes.values());
  }
}

// Run the API collector
if (require.main === module) {
  const collector = new GovernmentAPICollector();
  collector.run().catch(console.error);
}

module.exports = { GovernmentAPICollector };

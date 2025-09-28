const fs = require('fs');
const path = require('path');

/**
 * Clean Government Schemes Data
 * Removes filter UI text, quotes, and other unwanted elements from scraped scheme data
 */

class SchemeDataCleaner {
    constructor() {
        // Define patterns to remove from scheme names based on the actual scraped data
        this.unwantedPatterns = [
            /BackFilter ByFilter ByReset FiltersStateSelectScheme/gi,
            /tReset FiltersCloseFilter ByReset FiltersStateSelectScheme/gi,
            /CloseFilter ByReset FiltersStateSelectScheme/gi,
            /Filter ByReset FiltersStateSelectScheme/gi,
            /Reset FiltersStateSelectScheme/gi,
            /StateSelectScheme/gi,
            /CategorySocial welfare & Empowerme/gi,
            /Category[A-Za-z\s&]+/gi,
            /quotes\.\s*For example:\s*["']?Scheme["']?/gi,
            /quotes\.\s*For example:\s*/gi,
            /For example:\s*["']?/gi,
            /quotes\./gi,
            /tly AbledDBT SchemeBelow Poverty Li/gi,
            /ame"\.All SchemesState SchemesCe/gi,
            /tral SchemesSortFilterTotal \d+ schemes availableSortReleva/gi,
            /ame \(A→Z\)Scheme/gi,
            /BackFilter By/gi,
            /Filter By/gi,
            /Reset Filters/gi,
            /CloseFilter/gi,
            /State Select/gi,
            /Select Scheme/gi,
            /Sort Filter/gi,
            /Total \d+ schemes available/gi,
            /SortReleva/gi,
            /Search:/gi,
            /welfare/gi,
            /urban/gi,
            /["']/g,
            /^\s*["']/g,
            /["']\s*$/g,
            /\s{2,}/g, // Multiple spaces
            /^[^a-zA-Z0-9]*/, // Leading non-alphanumeric characters
            /[^a-zA-Z0-9\s\-().,&]*$/ // Trailing special characters except common ones
        ];

        // Define categories mapping
        this.categoryMapping = {
            'agriculture': 'Agriculture',
            'farming': 'Agriculture', 
            'crop': 'Agriculture',
            'kisan': 'Agriculture',
            'fasal': 'Agriculture',
            'health': 'Health',
            'medical': 'Health',
            'insurance': 'Health',
            'housing': 'Housing',
            'home': 'Housing',
            'awaas': 'Housing',
            'employment': 'Employment',
            'job': 'Employment',
            'skill': 'Employment',
            'rozgar': 'Employment',
            'education': 'Education',
            'school': 'Education',
            'scholarship': 'Education',
            'loan': 'Financial',
            'credit': 'Financial',
            'subsidy': 'Financial',
            'welfare': 'Social Welfare',
            'pension': 'Social Welfare',
            'widow': 'Social Welfare',
            'disability': 'Social Welfare',
            'food': 'Food Security',
            'ration': 'Food Security',
            'gas': 'Energy',
            'lpg': 'Energy',
            'electricity': 'Energy'
        };
    }

    /**
     * Clean scheme name by removing unwanted text patterns
     */
    cleanSchemeName(name) {
        if (!name || typeof name !== 'string') {
            return 'Not specified';
        }

        let cleanName = name;

        // Remove unwanted patterns
        this.unwantedPatterns.forEach(pattern => {
            cleanName = cleanName.replace(pattern, '');
        });

        // Clean up whitespace and formatting
        cleanName = cleanName
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/^\W+/, '') // Remove leading non-word characters
            .replace(/\W+$/, ''); // Remove trailing non-word characters

        // Capitalize first letter of each word for better readability
        cleanName = cleanName.replace(/\b\w+/g, function(word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });

        // Handle specific cases
        cleanName = cleanName
            .replace(/\bPm\b/g, 'PM')
            .replace(/\bDbt\b/g, 'DBT')
            .replace(/\bBpl\b/g, 'BPL')
            .replace(/\bCm\b/g, 'CM')
            .replace(/\bMantri\b/g, 'Mantri')
            .replace(/\bYojana\b/g, 'Yojana')
            .replace(/\bScheme\b/g, 'Scheme');

        return cleanName || 'Not specified';
    }

    /**
     * Determine category based on scheme name and description
     */
    determineCategory(schemeName, description = '') {
        const text = (schemeName + ' ' + description).toLowerCase();
        
        for (const [keyword, category] of Object.entries(this.categoryMapping)) {
            if (text.includes(keyword)) {
                return category;
            }
        }
        
        return 'Not specified';
    }

    /**
     * Clean and standardize state names
     */
    cleanState(state) {
        if (!state || typeof state !== 'string') {
            return 'Not specified';
        }

        const cleanState = state.trim();
        
        // Handle common variations
        const stateMapping = {
            'central': 'India',
            'central government': 'India',
            'all india': 'India',
            'pan india': 'India',
            'nationwide': 'India',
            'tamil nadu': 'Tamil Nadu',
            'tn': 'Tamil Nadu',
            'karnataka': 'Karnataka',
            'ka': 'Karnataka',
            'assam': 'Assam',
            'as': 'Assam',
            'maharashtra': 'Maharashtra',
            'mh': 'Maharashtra',
            'gujarat': 'Gujarat',
            'gj': 'Gujarat',
            'rajasthan': 'Rajasthan',
            'rj': 'Rajasthan'
        };

        return stateMapping[cleanState.toLowerCase()] || cleanState || 'Not specified';
    }

    /**
     * Clean eligibility text
     */
    cleanEligibility(eligibility) {
        if (!eligibility || typeof eligibility !== 'string') {
            return 'Not specified';
        }

        return eligibility.trim() || 'Not specified';
    }

    /**
     * Format benefit amount
     */
    formatBenefitAmount(amount) {
        if (!amount || amount === '' || amount === null || amount === undefined) {
            return '₹ Not specified';
        }

        const cleanAmount = String(amount).replace(/[^0-9.,]/g, '');
        
        if (cleanAmount === '' || cleanAmount === '0') {
            return '₹ Not specified';
        }

        return `₹ ${cleanAmount}`;
    }

    /**
     * Process a single scheme record
     */
    processScheme(scheme) {
        // Handle different possible field names
        const schemeName = scheme.scheme_name || scheme.schemeName || scheme.name || scheme.title || '';
        const state = scheme.state || scheme.location || scheme.region || '';
        const eligibility = scheme.eligibility || scheme.eligible || scheme.criteria || '';
        const category = scheme.category || scheme.type || '';
        const benefitAmount = scheme.benefit_amount || scheme.benefitAmount || scheme.amount || scheme.benefit || '';
        const description = scheme.description || scheme.desc || scheme.details || '';

        return {
            "Scheme Name": this.cleanSchemeName(schemeName),
            "State": this.cleanState(state),
            "Eligibility": this.cleanEligibility(eligibility),
            "Category": category || this.determineCategory(schemeName, description),
            "Benefit Amount": this.formatBenefitAmount(benefitAmount)
        };
    }

    /**
     * Process an array of scheme records
     */
    processSchemes(schemes) {
        if (!Array.isArray(schemes)) {
            console.error('Input must be an array of schemes');
            return [];
        }

        return schemes.map(scheme => this.processScheme(scheme));
    }

    /**
     * Process schemes from a file
     */
    async processFile(inputFilePath, outputFilePath = null) {
        try {
            console.log(`Reading schemes data from: ${inputFilePath}`);
            
            const fileContent = fs.readFileSync(inputFilePath, 'utf8');
            let schemes;

            // Parse JSON or CSV
            if (inputFilePath.endsWith('.json')) {
                schemes = JSON.parse(fileContent);
            } else if (inputFilePath.endsWith('.csv')) {
                // Simple CSV parser - you might want to use a library like csv-parse for complex CSVs
                const lines = fileContent.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                schemes = lines.slice(1)
                    .filter(line => line.trim())
                    .map(line => {
                        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                        const scheme = {};
                        headers.forEach((header, index) => {
                            scheme[header] = values[index] || '';
                        });
                        return scheme;
                    });
            } else {
                throw new Error('Unsupported file format. Please use .json or .csv files.');
            }

            console.log(`Processing ${schemes.length} schemes...`);
            const cleanedSchemes = this.processSchemes(schemes);

            // Save to output file
            const outputFile = outputFilePath || inputFilePath.replace(/\.(json|csv)$/, '_cleaned.json');
            fs.writeFileSync(outputFile, JSON.stringify(cleanedSchemes, null, 2));
            
            console.log(`✅ Cleaned schemes data saved to: ${outputFile}`);
            console.log(`📊 Processed ${cleanedSchemes.length} schemes`);
            
            // Show sample of cleaned data
            console.log('\n📋 Sample of cleaned data:');
            console.log(JSON.stringify(cleanedSchemes.slice(0, 3), null, 2));

            return cleanedSchemes;
        } catch (error) {
            console.error('❌ Error processing file:', error.message);
            throw error;
        }
    }
}

// Usage example and CLI interface
if (require.main === module) {
    const cleaner = new SchemeDataCleaner();

    // Example with sample corrupted data
    const sampleCorruptedData = [
        {
            "scheme_name": "BackFilter ByFilter ByReset FiltersStateSelectSchemePradhan Mantri Fasal Bima Yojana",
            "state": "central government",
            "eligibility": "All farmers growing notified crops",
            "category": "",
            "benefit_amount": "Variable"
        },
        {
            "scheme_name": "quotes. For example: Scheme\"DBT Scheme Below Poverty Line\"",
            "state": "",
            "eligibility": "",
            "category": "welfare",
            "benefit_amount": ""
        },
        {
            "scheme_name": "Filter ByReset FiltersKisan Credit Card Scheme",
            "state": "India",
            "eligibility": "Farmers for crop cultivation",
            "category": "agriculture",
            "benefit_amount": "300000"
        }
    ];

    console.log('🧹 Government Schemes Data Cleaner');
    console.log('=====================================\n');

    // Process sample data
    console.log('📝 Processing sample corrupted data...\n');
    const cleanedSample = cleaner.processSchemes(sampleCorruptedData);
    console.log('✅ Sample cleaned data:');
    console.log(JSON.stringify(cleanedSample, null, 2));

    // CLI usage instructions
    console.log('\n📋 Usage Instructions:');
    console.log('1. Place your corrupted schemes data in a JSON or CSV file');
    console.log('2. Run: node clean-schemes-data.js <input-file> [output-file]');
    console.log('3. Or use the cleaner programmatically:\n');
    console.log('   const { SchemeDataCleaner } = require("./clean-schemes-data");');
    console.log('   const cleaner = new SchemeDataCleaner();');
    console.log('   const cleaned = cleaner.processSchemes(yourData);');

    // If command line arguments provided
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const inputFile = args[0];
        const outputFile = args[1];
        
        if (fs.existsSync(inputFile)) {
            cleaner.processFile(inputFile, outputFile)
                .then(() => console.log('\n🎉 Data cleaning completed successfully!'))
                .catch(err => console.error('\n❌ Error:', err.message));
        } else {
            console.error(`\n❌ File not found: ${inputFile}`);
        }
    }
}

module.exports = { SchemeDataCleaner };

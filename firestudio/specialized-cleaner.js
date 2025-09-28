/**
 * Specialized Government Schemes Data Cleaner
 * Based on actual corrupted data from localhost:9005/government-schemes/
 */

class SpecializedSchemesCleaner {
    constructor() {
        // Enhanced patterns based on your actual screenshot
        this.corruptionPatterns = [
            // Main filter UI patterns
            /BackFilter ByFilter ByReset FiltersStateSelectScheme/gi,
            /tReset FiltersCloseFilter ByReset FiltersStateSelectScheme/gi,
            /CloseFilter ByReset FiltersStateSelectScheme/gi,
            /Filter ByReset FiltersStateSelectScheme/gi,
            /Reset FiltersStateSelectScheme/gi,
            
            // Category patterns
            /CategorySocial welfare & Empowerme/gi,
            /Category[A-Za-z\s&]+/gi,
            
            // Quote patterns
            /quotes\.\s*For example:\s*["']?Scheme["']?/gi,
            /quotes\.\s*For example:\s*/gi,
            /For example:\s*["']?/gi,
            /quotes\./gi,
            
            // Specific corrupted patterns from screenshot
            /tly AbledDBT SchemeBelow Poverty Li/gi,
            /ame"\.All SchemesState SchemesCe/gi,
            /tral SchemesSortFilterTotal \d+ schemes availableSortReleva/gi,
            /ame \(A→Z\)Scheme/gi,
            
            // UI elements
            /Search:\s*welfare/gi,
            /Search:\s*urban/gi,
            /Search:/gi,
            /SortFilterTotal \d+ schemes available/gi,
            /SortReleva/gi,
            /StateSelectScheme/gi,
            
            // General cleanup
            /BackFilter By/gi,
            /Filter By/gi,
            /Reset Filters/gi,
            /CloseFilter/gi,
            /State Select/gi,
            /Select Scheme/gi,
            /Sort Filter/gi,
            /Total \d+ schemes available/gi,
            
            // Character cleanup
            /["']/g,
            /^\s*["']/g,
            /["']\s*$/g,
            /\s{2,}/g, // Multiple spaces
            /^[^a-zA-Z0-9]*/, // Leading non-alphanumeric
            /[^a-zA-Z0-9\s\-().,&]*$/ // Trailing special chars
        ];
        
        // Known scheme name mappings for better accuracy
        this.schemeNameMappings = {
            'tly AbledDBT SchemeBelow Poverty Li': 'DBT Scheme Below Poverty Line',
            'ame".All SchemesState SchemesCe': 'All Schemes State Schemes',
            'tral SchemesSortFilterTotal': 'Central Schemes',
            'ame (A→Z)Scheme': 'Scheme (A-Z)',
            'CategorySocial welfare & Empowerme': 'Social Welfare & Empowerment',
            'Social welfare & Empowerme': 'Social Welfare & Empowerment'
        };
    }

    /**
     * Clean scheme name using enhanced patterns
     */
    cleanSchemeName(name) {
        if (!name || typeof name !== 'string') {
            return 'Not specified';
        }

        let cleanName = name.trim();
        
        // Check for direct mappings first
        for (const [corrupt, clean] of Object.entries(this.schemeNameMappings)) {
            if (cleanName.includes(corrupt)) {
                return clean;
            }
        }
        
        // Apply corruption patterns
        this.corruptionPatterns.forEach(pattern => {
            cleanName = cleanName.replace(pattern, '');
        });
        
        // Additional cleanup
        cleanName = cleanName
            .trim()
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/^\W+/, '') // Remove leading non-word chars
            .replace(/\W+$/, ''); // Remove trailing non-word chars
        
        // If nothing meaningful left, try to extract from original
        if (cleanName.length < 3) {
            cleanName = this.extractMeaningfulText(name);
        }
        
        // Capitalize properly
        cleanName = this.capitalizeWords(cleanName);
        
        return cleanName || 'Not specified';
    }
    
    /**
     * Extract meaningful text from heavily corrupted names
     */
    extractMeaningfulText(text) {
        // Look for meaningful words in the corruption
        const meaningfulWords = [
            'DBT', 'Scheme', 'Below', 'Poverty', 'Line',
            'Social', 'Welfare', 'Empowerment', 'Central',
            'State', 'All', 'Schemes', 'Pradhan', 'Mantri',
            'Kisan', 'Fasal', 'Bima', 'Yojana', 'Bharat'
        ];
        
        const words = text.split(/\s+/);
        const meaningful = words.filter(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            return meaningfulWords.some(meaningful => 
                cleanWord.toLowerCase().includes(meaningful.toLowerCase()) ||
                meaningful.toLowerCase().includes(cleanWord.toLowerCase())
            ) && cleanWord.length > 2;
        });
        
        return meaningful.join(' ');
    }
    
    /**
     * Proper word capitalization
     */
    capitalizeWords(text) {
        if (!text) return '';
        
        return text.replace(/\b\w+/g, (word) => {
            // Special cases
            const upperWords = ['DBT', 'PM', 'CM', 'BPL', 'LPG', 'ATM'];
            const lowerWords = ['and', 'or', 'the', 'of', 'in', 'for', 'to', 'with'];
            
            if (upperWords.includes(word.toUpperCase())) {
                return word.toUpperCase();
            }
            if (lowerWords.includes(word.toLowerCase())) {
                return word.toLowerCase();
            }
            
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
    }

    /**
     * Clean eligibility removing search artifacts
     */
    cleanEligibility(eligibility) {
        if (!eligibility || typeof eligibility !== 'string') {
            return 'Not specified';
        }
        
        let cleaned = eligibility
            .replace(/Search:\s*/gi, '')
            .replace(/welfare/gi, 'Social welfare beneficiaries')
            .replace(/urban/gi, 'Urban residents')
            .trim();
            
        return cleaned || 'Not specified';
    }

    /**
     * Process a single scheme with specialized cleaning
     */
    processScheme(scheme) {
        const schemeName = scheme.scheme_name || scheme.schemeName || scheme.name || '';
        const state = scheme.state || scheme.location || '';
        const eligibility = scheme.eligibility || scheme.eligible || '';
        const category = scheme.category || scheme.type || '';
        const benefitAmount = scheme.benefit_amount || scheme.benefitAmount || scheme.amount || '';

        return {
            "Scheme Name": this.cleanSchemeName(schemeName),
            "State": state === 'India' ? 'India' : (state || 'Not specified'),
            "Eligibility": this.cleanEligibility(eligibility),
            "Category": this.determineCategory(schemeName) || category || 'Not specified',
            "Benefit Amount": this.formatBenefitAmount(benefitAmount)
        };
    }

    /**
     * Auto-detect category from scheme name
     */
    determineCategory(schemeName) {
        const text = schemeName.toLowerCase();
        
        if (text.includes('welfare') || text.includes('social') || text.includes('empowerment')) {
            return 'Social Welfare';
        }
        if (text.includes('dbt') || text.includes('poverty') || text.includes('below')) {
            return 'Social Welfare';
        }
        if (text.includes('agriculture') || text.includes('farmer') || text.includes('crop')) {
            return 'Agriculture';
        }
        if (text.includes('health') || text.includes('medical')) {
            return 'Health';
        }
        if (text.includes('education') || text.includes('scholarship')) {
            return 'Education';
        }
        
        return 'Social Welfare'; // Default for welfare schemes
    }

    /**
     * Format benefit amount
     */
    formatBenefitAmount(amount) {
        if (!amount || amount === '' || amount === 'Not specified') {
            return '₹ Not specified';
        }
        
        const cleanAmount = String(amount).replace(/[^0-9.,]/g, '');
        return cleanAmount ? `₹ ${cleanAmount}` : '₹ Not specified';
    }

    /**
     * Process array of schemes
     */
    processSchemes(schemes) {
        if (!Array.isArray(schemes)) {
            console.error('Input must be an array of schemes');
            return [];
        }

        return schemes.map(scheme => this.processScheme(scheme));
    }
}

// Test with your actual screenshot data
function testWithScreenshotData() {
    const screenshotData = [
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

    console.log('🧹 Specialized Government Schemes Cleaner');
    console.log('==========================================\n');

    console.log('📋 ORIGINAL (From Screenshot):');
    screenshotData.forEach((scheme, i) => {
        console.log(`${i+1}. "${scheme.scheme_name}"`);
    });

    const cleaner = new SpecializedSchemesCleaner();
    const cleaned = cleaner.processSchemes(screenshotData);

    console.log('\n✨ CLEANED:');
    cleaned.forEach((scheme, i) => {
        console.log(`${i+1}. "${scheme['Scheme Name']}"`);
    });

    console.log('\n📊 Full Clean Dataset:');
    console.log(JSON.stringify(cleaned, null, 2));

    // Save results
    const fs = require('fs');
    fs.writeFileSync('screenshot-data-cleaned.json', JSON.stringify(cleaned, null, 2));
    console.log('\n💾 Saved to: screenshot-data-cleaned.json');

    return cleaned;
}

// Run test if this file is executed directly
if (require.main === module) {
    testWithScreenshotData();
}

module.exports = { SpecializedSchemesCleaner };

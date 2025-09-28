// Quick test of the cleaning functionality based on your screenshot data
const { SchemeDataCleaner } = require('./clean-schemes-data');

// Exact data from your screenshot
const corruptedData = [
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
    }
];

console.log('🧹 Government Schemes Data Cleaner Test');
console.log('=========================================\n');

console.log('📋 BEFORE (Corrupted Data):');
corruptedData.forEach((scheme, index) => {
    console.log(`${index + 1}. "${scheme.scheme_name}"`);
});

console.log('\n🔄 Processing...\n');

const cleaner = new SchemeDataCleaner();
const cleanedData = cleaner.processSchemes(corruptedData);

console.log('✨ AFTER (Cleaned Data):');
cleanedData.forEach((scheme, index) => {
    console.log(`${index + 1}. "${scheme['Scheme Name']}"`);
});

console.log('\n📊 Full Cleaned Dataset:');
console.log(JSON.stringify(cleanedData, null, 2));

// Save to file
const fs = require('fs');
fs.writeFileSync('test-cleaned-schemes.json', JSON.stringify(cleanedData, null, 2));
console.log('\n💾 Saved cleaned data to: test-cleaned-schemes.json');

module.exports = { corruptedData, cleanedData };

# Government Schemes Data Cleaner

This script cleans scraped government schemes data by removing unwanted UI text, filter labels, and formatting issues.

## Features

✅ **Removes unwanted patterns** like:
- "BackFilter ByFilter ByReset FiltersStateSelectScheme"
- "quotes. For example: Scheme"
- Filter UI text and navigation elements
- Extra quotes and special characters

✅ **Cleans and formats**:
- Scheme names (proper capitalization)
- State names (standardized)
- Eligibility criteria
- Categories (auto-detection)
- Benefit amounts (₹ formatting)

✅ **Handles missing data**:
- Sets empty fields to "Not specified"
- Validates data types
- Provides fallbacks for corrupted data

## Usage Examples

### 1. Sample Input (Corrupted Data)
```json
[
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
  }
]
```

### 2. Sample Output (Cleaned Data)
```json
[
  {
    "Scheme Name": "Pradhan Mantri Fasal Bima Yojana",
    "State": "India",
    "Eligibility": "All farmers growing notified crops",
    "Category": "Agriculture",
    "Benefit Amount": "₹ Variable"
  },
  {
    "Scheme Name": "DBT Scheme Below Poverty Line",
    "State": "Not specified",
    "Eligibility": "Not specified",
    "Category": "Social Welfare",
    "Benefit Amount": "₹ Not specified"
  }
]
```

## How to Use

### Method 1: Command Line
```bash
# For JSON files
node clean-schemes-data.js input-schemes.json output-clean-schemes.json

# For CSV files  
node clean-schemes-data.js input-schemes.csv output-clean-schemes.json
```

### Method 2: Programmatically
```javascript
const { SchemeDataCleaner } = require('./clean-schemes-data');

const cleaner = new SchemeDataCleaner();

// Clean array of schemes
const dirtyData = [/* your scraped data */];
const cleanData = cleaner.processSchemes(dirtyData);

// Clean from file
await cleaner.processFile('scraped-schemes.json', 'clean-schemes.json');
```

### Method 3: Quick Test
```javascript
const cleaner = new SchemeDataCleaner();

// Test with your corrupted scheme name
const testScheme = {
    scheme_name: "BackFilter ByFilter ByReset FiltersStateSelectSchemeYour Scheme Name Here",
    state: "central",
    eligibility: "Your eligibility criteria",
    category: "",
    benefit_amount: "5000"
};

const cleaned = cleaner.processScheme(testScheme);
console.log(JSON.stringify(cleaned, null, 2));
```

## Supported Data Formats

### Input Formats
- **JSON**: Array of scheme objects
- **CSV**: With headers (scheme_name, state, eligibility, category, benefit_amount)

### Field Mapping
The cleaner automatically maps common field variations:
- `scheme_name`, `schemeName`, `name`, `title` → "Scheme Name"
- `state`, `location`, `region` → "State"
- `eligibility`, `eligible`, `criteria` → "Eligibility"
- `category`, `type` → "Category"
- `benefit_amount`, `benefitAmount`, `amount`, `benefit` → "Benefit Amount"

## Categories Auto-Detection

The script automatically detects scheme categories based on keywords:
- **Agriculture**: farming, crop, kisan, fasal
- **Health**: medical, insurance, health
- **Housing**: home, awaas, housing
- **Employment**: job, skill, rozgar, employment
- **Education**: school, scholarship, education
- **Financial**: loan, credit, subsidy
- **Social Welfare**: welfare, pension, widow, disability
- **Food Security**: food, ration
- **Energy**: gas, lpg, electricity

## State Standardization

Common state name variations are automatically standardized:
- "central", "central government" → "India"
- "tn", "tamil nadu" → "Tamil Nadu"
- "ka", "karnataka" → "Karnataka"
- And more...

## Error Handling

- ✅ Handles missing or null values
- ✅ Validates data types
- ✅ Provides meaningful error messages
- ✅ Continues processing even if some records fail
- ✅ Shows progress and statistics

Ready to clean your scraped schemes data! 🧹✨

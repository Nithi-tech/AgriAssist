#!/usr/bin/env node

/**
 * Setup script for CSV import
 * Run with: node setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up CSV Import Script...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found');
  console.log('📝 Creating template .env file...');
  
  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CSV File Path
CSV_FILE_PATH=./data/POLICES_FINAL.csv
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env template file');
} else {
  console.log('✅ .env file found');
}

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json found');
} else {
  console.log('❌ package.json not found');
}

// Check if importPolicies.ts exists
const scriptPath = path.join(__dirname, 'importPolicies.ts');
if (fs.existsSync(scriptPath)) {
  console.log('✅ importPolicies.ts found');
} else {
  console.log('❌ importPolicies.ts not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Update .env file with your Supabase credentials');
console.log('2. Run: npm install');
console.log('3. Update CSV file path in importPolicies.ts');
console.log('4. Run: npm run import');

console.log('\n🎯 Ready to import your data!');

#!/usr/bin/env node

/**
 * API Configuration Test Script
 * Run this to verify your API keys are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FireStudio API Configuration Test\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const tests = [
  {
    name: 'Environment File',
    test: () => {
      const envPath = path.join(process.cwd(), '.env.local');
      return fs.existsSync(envPath);
    },
    message: 'Checking if .env.local file exists'
  },
  {
    name: 'Google AI API Key',
    test: () => {
      const key = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
      return key && key !== 'your_google_ai_api_key_here' && key.length > 10;
    },
    message: 'Required for crop recommendations and disease diagnosis',
    critical: true
  },
  {
    name: 'Weather API Key',
    test: () => {
      const key = process.env.WEATHERAPI_KEY;
      return key && key !== 'your_weatherapi_key_here' && key.length > 10;
    },
    message: 'Required for weather features',
    critical: true
  },
  {
    name: 'Google Cloud API Key',
    test: () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
      return key && key !== 'your_google_cloud_api_key_here' && key.length > 10;
    },
    message: 'Optional - for voice features',
    critical: false
  },
  {
    name: 'Google Translate API Key',
    test: () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
      return key && key !== 'your_google_translate_api_key_here' && key.length > 10;
    },
    message: 'Optional - for translation features',
    critical: false
  }
];

console.log('Running configuration tests...\n');

let passed = 0;
let failed = 0;
let criticalFailed = 0;

tests.forEach(test => {
  const result = test.test();
  const status = result ? '✅ PASS' : (test.critical ? '❌ FAIL' : '⚠️  SKIP');
  
  console.log(`${status} ${test.name}`);
  console.log(`     ${test.message}`);
  
  if (result) {
    passed++;
  } else {
    failed++;
    if (test.critical) {
      criticalFailed++;
    }
  }
  
  console.log('');
});

console.log('📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🚨 Critical Failed: ${criticalFailed}`);

if (criticalFailed > 0) {
  console.log('\n🚨 CRITICAL ISSUES FOUND:');
  console.log('Your app features will not work properly until critical API keys are configured.');
  console.log('Please follow the API_SETUP_GUIDE.md to fix these issues.');
  process.exit(1);
} else if (failed > 0) {
  console.log('\n⚠️  OPTIONAL FEATURES MISSING:');
  console.log('Core features will work, but some advanced features may be limited.');
  console.log('Consider adding optional API keys for full functionality.');
} else {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('Your API configuration is complete. All features should work properly.');
}

console.log('\nNext steps:');
console.log('1. Save your .env.local file');
console.log('2. Restart your development server: npm run dev');
console.log('3. Test your features in the app');

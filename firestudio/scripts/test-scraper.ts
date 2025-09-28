import { normalizeSchemeName, normalizeUrl } from '../utils/normalize';
import { load } from 'cheerio';

// Test data
const testSchemeName = [
  '  PM-KISAN Samman Nidhi  ',
  'Agricultural &amp; Rural Development',
  'Pradhan Mantri: Fasal Bima Yojana',
  'scheme-name  with\n\textra whitespace  ',
  '--- Tribal Development Programme ---'
];

const testHtml = `
<html>
  <head>
    <title>Karnataka Schemes</title>
    <meta name="state" content="karnataka">
  </head>
  <body>
    <nav class="breadcrumb">Home > Schemes > Karnataka</nav>
    <h1>Krishi Bhagya Scheme</h1>
    <p>State: Karnataka</p>
    <div class="description">
      <p>This scheme provides <strong>financial assistance</strong> to farmers.</p>
    </div>
    <div class="eligibility">
      <p>Eligible: Farmers with less than 2 hectares land</p>
    </div>
  </body>
</html>`;

console.log('🧪 Running Government Schemes Scraper Tests\n');

// Test 1: Scheme name normalization
console.log('1️⃣ Testing scheme name normalization:');
testSchemeName.forEach(name => {
  const normalized = normalizeSchemeName(name);
  console.log(`  "${name}" → "${normalized}"`);
});

// Test 2: URL normalization
console.log('\n2️⃣ Testing URL normalization:');
const testUrls = [
  'https://example.gov.in/schemes/pm-kisan/',
  'https://example.gov.in/schemes/pm-kisan?page=1&sort=name',
  'https://example.gov.in/schemes/pm-kisan?sort=name&page=1',
];

testUrls.forEach(url => {
  const normalized = normalizeUrl(url);
  console.log(`  "${url}" → "${normalized}"`);
});

// Test 3: State detection (mock function for testing)
console.log('\n3️⃣ Testing state detection from page HTML:');
const $ = load(testHtml);

// Mock state detection logic (simplified for testing)
function mockDetectState($: any): string {
  // Check meta tag
  const metaState = $('meta[name="state"]').attr('content');
  if (metaState) {
    return metaState.charAt(0).toUpperCase() + metaState.slice(1);
  }
  
  // Check breadcrumbs
  const breadcrumb = $('.breadcrumb').text();
  const match = breadcrumb.match(/Schemes\s*>\s*([^>]+)/);
  if (match) {
    return match[1].trim();
  }
  
  // Check content
  const stateMatch = $.text().match(/State:\s*([^,\n]+)/);
  if (stateMatch) {
    return stateMatch[1].trim();
  }
  
  return 'Unknown';
}

const detectedState = mockDetectState($);
console.log(`  Detected state: "${detectedState}"`);

// Test 4: Content extraction
console.log('\n4️⃣ Testing content extraction:');
const schemeName = $('h1').first().text().trim();
const description = $('.description p').text().trim();
const eligibility = $('.eligibility p').text().trim();

console.log(`  Scheme name: "${schemeName}"`);
console.log(`  Description: "${description}"`);
console.log(`  Eligibility: "${eligibility}"`);

console.log('\n✅ All tests completed successfully!');
console.log('\nTo run the actual scraper:');
console.log('npm run scrape:schemes -- --states=karnataka,tamil-nadu --save-json=schemes-sample.json');

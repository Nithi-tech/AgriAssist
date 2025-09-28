/**
 * Simple validation script for i18n system
 * Run with: node validate-i18n.mjs
 */

import fs from 'fs';
import path from 'path';

const LOCALE_DIR = './src/locales';
const REQUIRED_LANGUAGES = ['en', 'hi', 'ta', 'ml', 'te'];
const REQUIRED_KEYS = ['welcome', 'dashboard', 'language', 'settings.title'];

function validateTranslations() {
  console.log('🔍 Validating i18n translations...\n');
  
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {}
  };

  for (const lang of REQUIRED_LANGUAGES) {
    const filePath = path.join(LOCALE_DIR, lang, 'common.json');
    
    console.log(`📁 Checking ${lang}/common.json...`);
    
    if (!fs.existsSync(filePath)) {
      results.errors.push(`❌ Missing file: ${filePath}`);
      results.valid = false;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (content.trim() === '') {
        results.errors.push(`❌ Empty file: ${filePath}`);
        results.valid = false;
        continue;
      }

      const translations = JSON.parse(content);
      let keyCount = 0;
      let missingKeys = [];

      // Count total keys recursively
      function countKeys(obj, prefix = '') {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            countKeys(obj[key], fullKey);
          } else {
            keyCount++;
          }
        }
      }

      countKeys(translations);

      // Check required keys
      for (const requiredKey of REQUIRED_KEYS) {
        const keyPath = requiredKey.split('.');
        let current = translations;
        
        for (const segment of keyPath) {
          if (!current || typeof current !== 'object' || !(segment in current)) {
            missingKeys.push(requiredKey);
            break;
          }
          current = current[segment];
        }
      }

      results.summary[lang] = {
        keyCount,
        missingKeys,
        status: missingKeys.length === 0 ? '✅' : '⚠️'
      };

      if (missingKeys.length > 0) {
        results.warnings.push(`⚠️  ${lang}: Missing keys [${missingKeys.join(', ')}]`);
      }

      console.log(`   ${results.summary[lang].status} ${keyCount} keys, ${missingKeys.length} missing required keys`);

    } catch (error) {
      results.errors.push(`❌ Invalid JSON in ${filePath}: ${error.message}`);
      results.valid = false;
    }
  }

  console.log('\n📊 Summary:');
  console.table(results.summary);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`   ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (results.valid && results.warnings.length === 0) {
    console.log('\n🎉 All translations are valid!');
  } else if (results.valid) {
    console.log('\n✅ Translations are valid with warnings.');
  } else {
    console.log('\n💥 Translation validation failed!');
    process.exit(1);
  }

  return results;
}

// Run validation
validateTranslations();

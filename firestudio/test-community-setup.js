#!/usr/bin/env node

/**
 * Farmer Community Chat - Quick Setup Test
 * This script verifies the basic setup is working
 */

const fs = require('fs');
const path = require('path');

console.log('🌾 Farmer Community Chat - Setup Verification\n');

// Check required files
const requiredFiles = [
  'src/app/community/page.tsx',
  'src/app/community/Chat.tsx',
  'src/components/community/MessageList.tsx',
  'src/components/community/ChatInput.tsx',
  'src/components/community/ReplyInput.tsx',
  'src/components/community/LikeButton.tsx',
  'src/hooks/useCommunityChat.ts',
  'src/lib/supabaseCommunity.ts',
  'src/types/community.ts',
  'FARMER_COMMUNITY_CHAT_MIGRATION.sql'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'react-hot-toast',
    'date-fns',
    'lucide-react',
    'next',
    'react',
    'tailwindcss'
  ];
  
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep} v${deps[dep]}`);
    } else {
      console.log(`❌ ${dep} - NOT INSTALLED`);
      missingFiles.push(dep);
    }
  });
} else {
  console.log('❌ package.json not found');
  missingFiles.push('package.json');
}

// Check environment variables
console.log('\n🔧 Checking environment configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL found');
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL missing');
    missingFiles.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found');
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
    missingFiles.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
} else {
  console.log('⚠️  .env.local not found - you\'ll need to create it');
}

// Summary
console.log('\n📊 Setup Summary');
console.log('================');

if (missingFiles.length === 0) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('\n✨ Your Farmer Community Chat is ready!');
  console.log('\n🚀 Next steps:');
  console.log('1. Run the SQL migration in Supabase');
  console.log('2. Configure authentication providers');
  console.log('3. Start dev server: npm run dev');
  console.log('4. Visit: http://localhost:9005/community');
  console.log('\n📚 See FARMER_COMMUNITY_SETUP_GUIDE.md for detailed instructions');
} else {
  console.log(`❌ ${missingFiles.length} issues found:`);
  missingFiles.forEach(item => console.log(`   - ${item}`));
  console.log('\n🔧 Please resolve these issues and run the test again');
}

console.log('\n🌾 Happy farming and chatting!');

#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('Key:', supabaseKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testing database connection...');
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('agricultural_policies')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.error('❌ Health check failed:', healthError);
      return;
    }

    console.log('✅ Database connection successful');
    console.log(`📈 Total records in agricultural_policies: ${healthCheck || 'Unknown'}`);

    // Get actual data
    const { data, error, count } = await supabase
      .from('agricultural_policies')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Query failed:', error);
      return;
    }

    console.log(`\n📋 Sample data (showing ${data?.length || 0} of ${count || 0} total):`);
    
    if (data && data.length > 0) {
      data.forEach((scheme, index) => {
        console.log(`\n${index + 1}. ${scheme.state}: ${scheme.scheme_name}`);
        console.log(`   Explanation: ${scheme.explanation?.substring(0, 100)}...`);
        console.log(`   Eligibility: ${scheme.eligibility_criteria?.substring(0, 80)}...`);
        console.log(`   Link: ${scheme.link}`);
      });
    } else {
      console.log('❌ No data found in agricultural_policies table');
    }

    // Get state distribution
    const { data: stateData } = await supabase
      .from('agricultural_policies')
      .select('state')
      .limit(1000);

    if (stateData) {
      const stateCounts = stateData.reduce((acc, row) => {
        acc[row.state] = (acc[row.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n🗺️ Schemes by state:');
      Object.entries(stateCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([state, count]) => {
          console.log(`   ${state}: ${count} schemes`);
        });
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testConnection().then(() => {
  console.log('\n✅ Connection test completed');
  process.exit(0);
});

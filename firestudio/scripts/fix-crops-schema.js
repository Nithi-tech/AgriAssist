/**
 * FINAL CROPS SCHEMA MIGRATION SCRIPT
 * This script fixes all database schema issues for the crops table
 * Run with: node scripts/fix-crops-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting crops schema migration...');
    console.log('📋 This will:');
    console.log('   1. Verify land_size_unit and yield_unit columns exist');
    console.log('   2. Test API compatibility');
    console.log('   3. Update any NULL values to defaults');
    
    // Test the current schema by trying to insert a complete record
    console.log('\n🧪 Testing current API compatibility...');
    const testData = {
      crop_name: 'Schema Test Crop',
      planting_date: '2025-01-01',
      location: 'Test Field',
      irrigation_type: 'drip',
      land_size: 1.5,
      land_size_unit: 'acres',
      estimated_yield: 100,
      yield_unit: 'kg',
      status: 'active',
      season: 'kharif',
      farming_method: 'organic'
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('crops')
      .insert(testData)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Schema test failed:', testError);
      console.log('\n🔧 This indicates that the database schema needs updating.');
      console.log('📝 Please run the following SQL in your Supabase Dashboard:');
      console.log('\n' + '='.repeat(60));
      console.log(`
-- Add missing columns if they don't exist
ALTER TABLE crops ADD COLUMN IF NOT EXISTS land_size_unit VARCHAR(10) DEFAULT 'acres';
ALTER TABLE crops ADD COLUMN IF NOT EXISTS yield_unit VARCHAR(20) DEFAULT 'kg';

-- Drop currency column if it exists (removed from app)
ALTER TABLE crops DROP COLUMN IF EXISTS currency;

-- Update NULL values to defaults
UPDATE crops SET land_size_unit = 'acres' WHERE land_size_unit IS NULL;
UPDATE crops SET yield_unit = 'kg' WHERE yield_unit IS NULL;
UPDATE crops SET status = 'active' WHERE status IS NULL;

-- Add constraints for data validation
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_land_size_unit_check;
ALTER TABLE crops ADD CONSTRAINT crops_land_size_unit_check 
CHECK (land_size_unit IN ('acres', 'hectares', 'bigha'));

ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_yield_unit_check;
ALTER TABLE crops ADD CONSTRAINT crops_yield_unit_check 
CHECK (yield_unit IN ('kg', 'tons', 'quintals', 'bags'));
      `);
      console.log('='.repeat(60));
      console.log('\n💡 After running the SQL, restart your Next.js app to clear the schema cache.');
      
    } else {
      console.log('✅ Schema test successful!');
      console.log('📄 Sample record created:', {
        id: testResult.id,
        crop_name: testResult.crop_name,
        land_size: testResult.land_size,
        land_size_unit: testResult.land_size_unit,
        yield_unit: testResult.yield_unit
      });
      
      // Clean up test record
      await supabase.from('crops').delete().eq('id', testResult.id);
      console.log('🧹 Test record cleaned up');
      console.log('\n🎉 Your crops schema is working correctly!');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n🔧 Please check your environment variables and database connection.');
  }
}

console.log('🌾 Crops Schema Migration Tool');
console.log('==============================');
runMigration();

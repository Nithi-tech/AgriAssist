// scripts/importWelfareSchemes.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importWelfareSchemes(csvFilePath) {
  try {
    console.log('Reading CSV file:', csvFilePath);
    
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        cast: (value, context) => {
          // Convert string booleans to actual booleans
          if (context.column === 'is_active') {
            return value.toLowerCase() === 'true';
          }
          // Convert string numbers to integers
          if (context.column === 'launch_year' || context.column === 'id') {
            return value ? parseInt(value, 10) : null;
          }
          // Return null for empty strings
          return value === '' ? null : value;
        }
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    console.log(`Found ${records.length} records to import`);

    // Remove id field from records as it's auto-generated
    const recordsToInsert = records.map(record => {
      const { id, ...rest } = record;
      return rest;
    });

    // Insert data in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recordsToInsert.length / batchSize)}`);
      
      const { data, error } = await supabase
        .from('welfare_schemes')
        .insert(batch)
        .select();

      if (error) {
        console.error('Error inserting batch:', error);
        errorCount += batch.length;
      } else {
        console.log(`Successfully inserted ${data.length} records`);
        successCount += data.length;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total records processed: ${records.length}`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed to import: ${errorCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

async function clearTable() {
  console.log('Clearing existing data...');
  const { error } = await supabase
    .from('welfare_schemes')
    .delete()
    .neq('id', 0); // Delete all records

  if (error) {
    console.error('Error clearing table:', error);
    return false;
  }
  
  console.log('Table cleared successfully');
  return true;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const csvFilePath = args[0];
  const clearFirst = args.includes('--clear');

  if (!csvFilePath) {
    console.error('Usage: node importWelfareSchemes.js <csv-file-path> [--clear]');
    console.error('Example: node importWelfareSchemes.js ./data/welfare_schemes_sample.csv --clear');
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    if (clearFirst) {
      await clearTable();
    }

    await importWelfareSchemes(csvFilePath);
    console.log('\nImport completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { importWelfareSchemes, clearTable };

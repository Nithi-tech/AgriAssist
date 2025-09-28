import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PolicyRow {
  state: string;
  scheme_name: string;
  explanation: string;
  eligibility_criteria: string;
  link: string;
}

// Function to clean and normalize text
function cleanText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/["'"]/g, '"') // Normalize quotes
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .substring(0, 5000); // Limit length to prevent overflow
}

// Function to parse CSV and extract policies
async function parseCSVFile(filePath: string): Promise<PolicyRow[]> {
  return new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    
    Papa.parse(csvContent, {
      header: false, // We'll handle headers manually due to the state-based structure
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const policies: PolicyRow[] = [];
          let currentState = '';
          
          const rows = results.data as string[][];
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip completely empty rows
            if (!row || row.every(cell => !cell || cell.trim() === '')) {
              continue;
            }
            
            // Check if this is a state header row (first column has state name, others empty/minimal)
            if (row[0] && row[0].trim() && 
                (!row[1] || row[1].trim() === '') && 
                (!row[2] || row[2].trim() === '') && 
                (!row[3] || row[3].trim() === '')) {
              currentState = cleanText(row[0]).toUpperCase();
              console.log(`Found state: ${currentState}`);
              continue;
            }
            
            // Check if this is a header row (SCHEME, EXPLANATION, etc.)
            if (row[0] && row[0].toLowerCase().includes('scheme')) {
              continue;
            }
            
            // Process data rows with all 4 columns
            if (currentState && row.length >= 4 && row[0] && row[0].trim()) {
              const policy: PolicyRow = {
                state: currentState,
                scheme_name: cleanText(row[0]),
                explanation: cleanText(row[1] || ''),
                eligibility_criteria: cleanText(row[2] || ''),
                link: cleanText(row[3] || '')
              };
              
              // Only add if scheme name is meaningful
              if (policy.scheme_name.length > 3) {
                policies.push(policy);
                console.log(`Added policy: ${policy.scheme_name} for ${currentState}`);
              }
            }
          }
          
          console.log(`\nTotal policies parsed: ${policies.length}`);
          resolve(policies);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}

// Function to insert data in batches
async function insertPoliciesInBatches(policies: PolicyRow[], batchSize: number = 100) {
  console.log(`\nStarting batch insertion of ${policies.length} policies...`);
  
  let insertedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < policies.length; i += batchSize) {
    const batch = policies.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('agricultural_policies')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
        errorCount += batch.length;
        
        // Try inserting individually to identify problematic rows
        for (const policy of batch) {
          try {
            const { error: individualError } = await supabase
              .from('agricultural_policies')
              .insert([policy]);
            
            if (individualError) {
              console.error(`Failed to insert policy: ${policy.scheme_name}`, individualError);
            } else {
              insertedCount++;
            }
          } catch (err) {
            console.error(`Error inserting individual policy: ${policy.scheme_name}`, err);
          }
        }
      } else {
        insertedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed: ${batch.length} policies inserted`);
      }
    } catch (error) {
      console.error(`Unexpected error in batch ${Math.floor(i / batchSize) + 1}:`, error);
      errorCount += batch.length;
    }
  }
  
  return { insertedCount, errorCount };
}

// Main import function
async function importCSVToSupabase() {
  try {
    console.log('🚀 Starting CSV import to Supabase...\n');
    
    // Path to your CSV file
    const csvFilePath = path.join('C:', 'Users', 'nithi', 'OneDrive', 'Documents', 'Copy of POLICES_FINAL(1).csv');
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at: ${csvFilePath}`);
    }
    
    console.log(`📄 Reading CSV file: ${csvFilePath}`);
    
    // Parse CSV
    const policies = await parseCSVFile(csvFilePath);
    
    if (policies.length === 0) {
      throw new Error('No valid policies found in CSV file');
    }
    
    console.log(`\n📊 Parsed ${policies.length} policies from CSV`);
    
    // Show sample data
    console.log('\n📋 Sample policy:');
    console.log(JSON.stringify(policies[0], null, 2));
    
    // Clear existing data (optional - remove this if you want to keep existing data)
    console.log('\n🧹 Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('agricultural_policies')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (deleteError) {
      console.warn('Warning: Could not clear existing data:', deleteError);
    } else {
      console.log('✅ Existing data cleared');
    }
    
    // Insert data in batches
    const { insertedCount, errorCount } = await insertPoliciesInBatches(policies, 50);
    
    // Summary
    console.log('\n📊 IMPORT SUMMARY');
    console.log('='.repeat(40));
    console.log(`Total policies in CSV: ${policies.length}`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Failed insertions: ${errorCount}`);
    console.log(`Success rate: ${((insertedCount / policies.length) * 100).toFixed(1)}%`);
    
    // Verify import
    const { data: verifyData, error: verifyError } = await supabase
      .from('agricultural_policies')
      .select('count', { count: 'exact' });
    
    if (!verifyError) {
      console.log(`\n✅ Verification: ${verifyData?.length || 0} total records in database`);
    }
    
    console.log('\n🎉 Import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importCSVToSupabase()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { importCSVToSupabase };

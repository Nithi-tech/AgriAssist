#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

// Load environment variables from the main project
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Missing Supabase credentials. Check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PolicyRecord {
  state: string;
  scheme_name: string;
  explanation: string;
  eligibility_criteria: string;
  link: string;
}

class StateBasedCSVImporter {
  private csvFilePath: string;

  constructor() {
    this.csvFilePath = path.join('C:', 'Users', 'nithi', 'OneDrive', 'Documents', 'Copy of POLICES_FINAL(1).csv');
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string | undefined): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/["'"*]/g, '') // Remove quotes and asterisks
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/�/g, "'") // Replace special characters
      .substring(0, 5000); // Limit length to prevent overflow
  }

  /**
   * Check if a row is a state header
   */
  private isStateHeader(row: string[]): boolean {
    if (!row || row.length === 0) return false;
    
    const firstCell = this.cleanText(row[0]);
    const otherCells = row.slice(1);
    
    // State header has state name in first column and other columns are mostly empty
    return firstCell.length > 2 && 
           firstCell.toUpperCase() === firstCell && // Usually uppercase
           otherCells.every(cell => !cell || cell.trim() === '' || cell.trim() === ',');
  }

  /**
   * Check if a row is a scheme header (SCHEME, EXPLANATION, etc.)
   */
  private isSchemeHeader(row: string[]): boolean {
    if (!row || row.length === 0) return false;
    
    const firstCell = this.cleanText(row[0]).toLowerCase();
    return firstCell.includes('scheme') || firstCell.includes('explanation');
  }

  /**
   * Validate if a record is complete
   */
  private isValidRecord(record: PolicyRecord): boolean {
    return !!(record.state && record.scheme_name && 
             record.state.length > 1 && record.scheme_name.length > 3);
  }

  /**
   * Create deduplication key
   */
  private createDedupeKey(state: string, schemeName: string): string {
    return `${state.toLowerCase().trim()}-${schemeName.toLowerCase().trim()}`;
  }

  /**
   * Clear existing data from agricultural_policies table
   */
  async clearExistingData(): Promise<void> {
    console.log('🗑️  Clearing existing agricultural_policies data...');
    
    try {
      const { error } = await supabase
        .from('agricultural_policies')
        .delete()
        .neq('id', 0); // Delete all rows

      if (error) {
        throw new Error(`Failed to clear data: ${error.message}`);
      }

      console.log('✅ Successfully cleared existing data');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file with state-based structure
   */
  async parseCSVFile(): Promise<PolicyRecord[]> {
    console.log(`📄 Reading CSV file: ${this.csvFilePath}`);

    if (!fs.existsSync(this.csvFilePath)) {
      throw new Error(`❌ CSV file not found: ${this.csvFilePath}`);
    }

    return new Promise((resolve, reject) => {
      const csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
      
      Papa.parse(csvContent, {
        header: false, // We'll handle the structure manually
        skipEmptyLines: false, // We need to see empty lines to detect structure
        complete: (results) => {
          try {
            console.log(`📊 Raw CSV rows: ${results.data.length}`);
            
            const policies: PolicyRecord[] = [];
            const seen = new Set<string>();
            let currentState = '';
            let skipped = 0;

            const rows = results.data as string[][];

            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              
              // Skip completely empty rows
              if (!row || row.every(cell => !cell || cell.trim() === '')) {
                continue;
              }

              // Check if this is a state header
              if (this.isStateHeader(row)) {
                currentState = this.cleanText(row[0]);
                console.log(`📍 Found state: ${currentState}`);
                continue;
              }

              // Check if this is a scheme header row
              if (this.isSchemeHeader(row)) {
                console.log(`📋 Found scheme headers for ${currentState}`);
                continue;
              }

              // Process data rows
              if (currentState && row.length >= 3 && row[0] && this.cleanText(row[0])) {
                const schemeName = this.cleanText(row[0]);
                const explanation = this.cleanText(row[1] || '');
                const eligibilityCriteria = this.cleanText(row[2] || '');
                const link = this.cleanText(row[3] || '');

                const record: PolicyRecord = {
                  state: currentState,
                  scheme_name: schemeName,
                  explanation,
                  eligibility_criteria: eligibilityCriteria,
                  link
                };

                // Validate record
                if (!this.isValidRecord(record)) {
                  skipped++;
                  console.warn(`⚠️  Row ${i + 1}: Invalid - ${schemeName || 'No scheme name'}`);
                  continue;
                }

                // Check for duplicates
                const dedupeKey = this.createDedupeKey(record.state, record.scheme_name);
                if (seen.has(dedupeKey)) {
                  skipped++;
                  console.warn(`⚠️  Row ${i + 1}: Duplicate - ${record.state}: ${record.scheme_name}`);
                  continue;
                }

                seen.add(dedupeKey);
                policies.push(record);

                console.log(`✅ Added: ${currentState} - ${schemeName}`);
              }
            }

            console.log(`\n📊 PARSING SUMMARY:`);
            console.log(`✅ Valid records: ${policies.length}`);
            console.log(`⚠️  Skipped records: ${skipped}`);
            console.log(`📈 Success rate: ${((policies.length / (policies.length + skipped)) * 100).toFixed(1)}%`);
            
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

  /**
   * Insert data in batches
   */
  async insertData(policies: PolicyRecord[]): Promise<void> {
    console.log(`\n💾 Inserting ${policies.length} records into Supabase...`);

    const batchSize = 25; // Smaller batches for better error handling
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < policies.length; i += batchSize) {
      const batch = policies.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(policies.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);

      try {
        const { data, error } = await supabase
          .from('agricultural_policies')
          .insert(batch)
          .select('id');

        if (error) {
          console.error(`❌ Batch ${batchNumber} failed:`, error.message);
          
          // Try inserting records individually to identify issues
          for (const policy of batch) {
            try {
              const { error: individualError } = await supabase
                .from('agricultural_policies')
                .insert([policy]);

              if (individualError) {
                console.error(`  ❌ Failed: ${policy.state} - ${policy.scheme_name.substring(0, 50)}...`);
                totalErrors++;
              } else {
                totalInserted++;
                console.log(`  ✅ Individual success: ${policy.state} - ${policy.scheme_name.substring(0, 30)}...`);
              }
            } catch (err) {
              totalErrors++;
            }
          }
        } else {
          totalInserted += batch.length;
          console.log(`  ✅ Batch ${batchNumber} successful`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`💥 Unexpected error in batch ${batchNumber}:`, error);
        totalErrors += batch.length;
      }
    }

    console.log(`\n📊 INSERTION SUMMARY:`);
    console.log(`✅ Successfully inserted: ${totalInserted}`);
    console.log(`❌ Failed insertions: ${totalErrors}`);
    console.log(`📈 Success rate: ${((totalInserted / policies.length) * 100).toFixed(1)}%`);
  }

  /**
   * Verify the import
   */
  async verifyImport(): Promise<void> {
    console.log('\n🔍 Verifying import...');

    try {
      const { data, error, count } = await supabase
        .from('agricultural_policies')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Verification failed:', error);
        return;
      }

      console.log(`✅ Verification complete: ${count} total records in database`);

      // Get state distribution
      const { data: stateData } = await supabase
        .from('agricultural_policies')
        .select('state')
        .limit(1000);

      if (stateData && stateData.length > 0) {
        const stateCounts = stateData.reduce((acc, record) => {
          acc[record.state] = (acc[record.state] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('\n📋 Records by state:');
        Object.entries(stateCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .forEach(([state, count]) => {
            console.log(`  ${state}: ${count} schemes`);
          });
      }

    } catch (error) {
      console.error('💥 Verification error:', error);
    }
  }

  /**
   * Run the complete import process
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting State-Based Government Schemes Import...\n');

      // Step 1: Clear existing data
      await this.clearExistingData();

      // Step 2: Parse CSV
      const policies = await this.parseCSVFile();

      if (policies.length === 0) {
        console.log('⚠️  No valid policies found in CSV');
        return;
      }

      // Step 3: Insert data
      await this.insertData(policies);

      // Step 4: Verify import
      await this.verifyImport();

      console.log('\n🎊 Government Schemes Import Completed Successfully!');

    } catch (error) {
      console.error('\n💥 Import failed:', error);
      process.exit(1);
    }
  }
}

// Run the import
if (require.main === module) {
  const importer = new StateBasedCSVImporter();
  importer.run()
    .then(() => {
      console.log('✅ Import script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import script failed:', error);
      process.exit(1);
    });
}

export default StateBasedCSVImporter;

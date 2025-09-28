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

interface CSVRow {
  state?: string;
  scheme_name?: string;
  explanation?: string;
  eligibility_criteria?: string;
  link?: string;
  [key: string]: string | undefined;
}

class GovernmentSchemesImporter {
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
      .replace(/["'"]/g, '"') // Normalize quotes
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .substring(0, 5000); // Limit length to prevent overflow
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
   * Parse CSV file with proper header detection
   */
  async parseCSVFile(): Promise<PolicyRecord[]> {
    console.log(`📄 Reading CSV file: ${this.csvFilePath}`);

    if (!fs.existsSync(this.csvFilePath)) {
      throw new Error(`❌ CSV file not found: ${this.csvFilePath}`);
    }

    return new Promise((resolve, reject) => {
      const csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
      
      Papa.parse<CSVRow>(csvContent, {
        header: true, // Use first row as headers
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize header names
          return header.toLowerCase().trim().replace(/\s+/g, '_');
        },
        complete: (results) => {
          try {
            console.log(`📊 Raw CSV rows: ${results.data.length}`);
            
            const policies: PolicyRecord[] = [];
            const seen = new Set<string>();
            let skipped = 0;

            results.data.forEach((row, index) => {
              try {
                // Handle different possible column names
                const state = this.cleanText(
                  row.state || row.State || row.STATE || 
                  row['state name'] || row['State Name']
                );
                
                const schemeName = this.cleanText(
                  row.scheme_name || row['scheme name'] || row.Scheme || 
                  row['Scheme Name'] || row.SCHEME_NAME
                );
                
                const explanation = this.cleanText(
                  row.explanation || row.Explanation || row.EXPLANATION ||
                  row.description || row.Description
                );
                
                const eligibilityCriteria = this.cleanText(
                  row.eligibility_criteria || row['eligibility criteria'] ||
                  row.Eligibility || row['Eligibility Criteria'] ||
                  row.ELIGIBILITY_CRITERIA
                );
                
                const link = this.cleanText(
                  row.link || row.Link || row.LINK || row.url || row.URL ||
                  row.website || row.Website
                );

                const record: PolicyRecord = {
                  state,
                  scheme_name: schemeName,
                  explanation,
                  eligibility_criteria: eligibilityCriteria,
                  link
                };

                // Validate record
                if (!this.isValidRecord(record)) {
                  skipped++;
                  console.warn(`⚠️  Row ${index + 1}: Invalid record - missing state or scheme name`);
                  return;
                }

                // Check for duplicates
                const dedupeKey = this.createDedupeKey(record.state, record.scheme_name);
                if (seen.has(dedupeKey)) {
                  skipped++;
                  console.warn(`⚠️  Row ${index + 1}: Duplicate - ${record.state}: ${record.scheme_name}`);
                  return;
                }

                seen.add(dedupeKey);
                policies.push(record);

                if (policies.length % 100 === 0) {
                  console.log(`📈 Processed ${policies.length} valid records...`);
                }

              } catch (error) {
                skipped++;
                console.warn(`⚠️  Row ${index + 1}: Processing error -`, error);
              }
            });

            console.log(`✅ Processed ${policies.length} valid records (${skipped} skipped)`);
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
    console.log(`💾 Inserting ${policies.length} records into Supabase...`);

    const batchSize = 50;
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
                console.error(`  ❌ Failed: ${policy.state} - ${policy.scheme_name}:`, individualError.message);
                totalErrors++;
              } else {
                totalInserted++;
              }
            } catch (err) {
              console.error(`  💥 Error: ${policy.state} - ${policy.scheme_name}:`, err);
              totalErrors++;
            }
          }
        } else {
          totalInserted += batch.length;
          console.log(`  ✅ Batch ${batchNumber} successful`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

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

      // Get sample data
      const { data: sampleData } = await supabase
        .from('agricultural_policies')
        .select('state, scheme_name')
        .limit(5);

      if (sampleData && sampleData.length > 0) {
        console.log('\n📋 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.state}: ${record.scheme_name}`);
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
      console.log('🚀 Starting Government Schemes Import...\n');

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
  const importer = new GovernmentSchemesImporter();
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

export default GovernmentSchemesImporter;

# Welfare Schemes Scraper & Integration

This module scrapes welfare schemes from [myscheme.gov.in](https://www.myscheme.gov.in/) and integrates them into our government schemes portal.

## Features

- Scrapes central and state welfare schemes
- Deduplicates entries based on scheme name + state
- Stores data in Supabase with full-text search
- Weekly automated updates via GitHub Actions
- Responsive table and grid views in the UI
- Advanced filtering and search capabilities

## Setup

1. **Environment Variables**

Create a `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

2. **Database Setup**

Run the SQL migration script in your Supabase SQL editor:

```sql
-- Copy contents of sql/create_welfare_schemes_table.sql
```

3. **Install Dependencies**

```bash
npm install
npx playwright install chromium
```

## Running the Scraper

### Manual Run

```bash
node scripts/scrapeWelfareSchemes.js
```

The scraper will:
- Scrape schemes from myscheme.gov.in
- Save JSON and CSV files in the `data/` directory
- Upsert records to Supabase
- Generate a scrape log with statistics

### Automated Updates

The GitHub Actions workflow in `.github/workflows/update-welfare-schemes.yml` runs weekly and:
1. Scrapes fresh data
2. Creates a PR with updates
3. Uploads data files as artifacts

## Data Structure

Each scheme record contains:

```typescript
interface WelfareScheme {
  id: string;                // UUID
  scheme_name: string;       // Name of the scheme
  state: string;            // State where applicable
  eligibility: string;      // Eligibility criteria
  link: string;            // Application/details link
  explanation: string;      // Detailed description
  category?: string;        // Scheme category
  benefit_amount?: number;  // Monetary benefit if specified
  source_url: string;       // URL where scraped
  created_at: Date;        // Record creation timestamp
  updated_at: Date;        // Last update timestamp
  verified?: boolean;      // Verification status
  tags?: string[];        // Searchable tags
  start_date?: Date;      // Scheme start date
  end_date?: Date;        // Scheme end date
  targeted_group?: string; // Target beneficiaries
}
```

## Error Handling

The scraper implements:
- Rate limiting (1 req/sec)
- Automatic retries
- Detailed error logging
- State-level isolation (errors in one state don't affect others)

## Contributing

1. Create a feature branch
2. Make changes
3. Run scraper locally to test
4. Submit PR with:
   - Scrape logs
   - Updated data files
   - Any UI/component changes

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Adjust `rateLimit` in scraper config if needed
2. **Duplicate Entries**: Check normalized scheme names
3. **Missing Data**: Verify selectors in scraper
4. **Database Errors**: Check Supabase credentials and permissions

### Data Quality

To maintain data quality:
1. Regular audits of scraped data
2. Manual verification of new schemes
3. Periodic cleanup of expired schemes
4. Validation of benefit amounts and dates

# Government Schemes Scraper

A comprehensive TypeScript-based scraper for Indian government welfare schemes with multi-state support, intelligent state detection, and Supabase integration.

## Features

- **Multi-State Support**: Scrape schemes from all Indian states and central government
- **Intelligent State Detection**: Advanced heuristics to detect correct state for each scheme
- **Exact Scheme Name Extraction**: Preserves official scheme names exactly as shown on government sites
- **Pagination Handling**: Automatically follows pagination to get all schemes
- **Robust Error Handling**: Retries, rate limiting, and comprehensive logging
- **Dual Scraping Strategy**: Uses Playwright for JS-heavy sites and Cheerio for static HTML
- **Deduplication**: Prevents duplicate entries using stable record keys
- **Multiple Output Formats**: Save to JSON files and/or Supabase database
- **Production Ready**: CLI interface with configurable options

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Usage

### Basic Usage

```bash
# Test run with 2 default states
npm run scrape:schemes

# Scrape specific states
npm run scrape:schemes -- --states=karnataka,tamil-nadu

# Scrape all states (use with caution)
npm run scrape:schemes -- --states=all
```

### Save Options

```bash
# Save to JSON file
npm run scrape:schemes -- --save-json=schemes.json

# Save to Supabase (requires env variables)
npm run scrape:schemes -- --save-to-supabase

# Dry run (no database operations)
npm run scrape:schemes -- --dry-run --save-json=sample.json
```

### Advanced Options

```bash
npm run scrape:schemes -- \
  --states=karnataka,tamil-nadu \
  --save-json=schemes.json \
  --concurrency=5 \
  --delay=200 \
  --max-retries=5
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--states` | Comma-separated state slugs or "all" | First 2 states |
| `--save-json` | Path to save JSON results | None |
| `--save-to-supabase` | Save to Supabase database | false |
| `--dry-run` | Preview results without saving to DB | false |
| `--concurrency` | Number of concurrent requests | 3 |
| `--delay` | Delay between requests (ms) | 400 |
| `--max-retries` | Maximum retry attempts | 3 |

## Environment Variables

For Supabase integration, set these environment variables:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## State Detection Logic

The scraper uses a priority-based approach to detect the correct state:

1. **Page Metadata**: `<meta name="state">`, OpenGraph tags, JSON-LD data
2. **Breadcrumbs**: Navigation paths like "Home > Schemes > Karnataka"
3. **URL Segments**: State slugs in the URL path
4. **Content Labels**: Text patterns like "State: Karnataka", "Applicable in: Tamil Nadu"
5. **Central Scheme Detection**: Ministry pages, national portals, central government indicators
6. **Fallback**: Parent state from the listing page

## Output Format

Each scheme record contains:

```json
{
  "scheme_name": "PM-KISAN Samman Nidhi",
  "state": "Central",
  "description_html": "<p>HTML description...</p>",
  "description_text": "Clean text description",
  "eligibility_html": "<p>HTML eligibility...</p>",
  "eligibility_text": "Clean eligibility text",
  "link": "https://pmkisan.gov.in/",
  "source_url": "https://pmkisan.gov.in/",
  "scraped_at": "2025-08-13T12:00:00Z"
}
```

## Database Setup

1. Create the Supabase table using the SQL file:
```bash
# Apply the SQL schema
cat sql/welfare_schemes.sql | psql your_database_url
```

2. The scraper automatically handles upserts with deduplication based on `(scheme_name, state, link)`.

## Supported Selectors

The scraper tries multiple selectors for reliable data extraction:

### Scheme Names
- `h1`, `.scheme-title`, `.scheme-name`, `[role="heading"]`
- Falls back to `<title>` tag with site name removal

### Descriptions
- `.scheme-description`, `.description`, `.scheme-details`, `.content`
- Main content paragraphs in various containers

### Eligibility
- `.eligibility`, `.scheme-eligibility`, `.who-can-apply`, `.eligible`
- Elements with "eligib" in class or ID

## Logging and Debugging

Logs are saved to:
- `logs/errors-YYYY-MM-DD.json` - Detailed error information
- `logs/duplicates-YYYY-MM-DD.log` - Duplicate record keys
- `errors/raw-pages/` - Raw HTML of failed pages (for debugging)

## Testing

Run the test suite to verify core functionality:

```bash
npm run test:scraper
```

This tests:
- Scheme name normalization
- URL normalization
- State detection logic
- Content extraction

## State Slugs

The scraper includes a comprehensive mapping of state slugs to canonical names in `data/stateSlugs.json`. Supported states include all 28 states and 8 union territories of India, plus central government schemes.

## Error Handling

The scraper includes robust error handling:

- **Exponential Backoff**: Failed requests are retried with increasing delays
- **Rate Limiting**: Configurable delays between requests to respect server resources
- **Graceful Degradation**: Falls back from Playwright to Cheerio for simple pages
- **Comprehensive Logging**: All errors are logged with context for debugging
- **Safe Continuation**: Individual page failures don't stop the entire scraping process

## Performance Considerations

- Default concurrency of 3 requests balances speed with server politeness
- Configurable delays prevent overwhelming government servers
- Duplicate detection prevents redundant processing
- Efficient pagination handling avoids infinite loops

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acceptance Tests

Sample commands that demonstrate the scraper working correctly:

```bash
# Basic test run
npm run test:scraper

# Sample state scraping
npm run scrape:schemes -- --states=karnataka,tamil-nadu --save-json=schemes-sample.json --dry-run

# Full production run (use carefully)
npm run scrape:schemes -- --states=all --save-to-supabase --concurrency=2 --delay=1000
```

Expected results:
- Each record has exact `scheme_name` matching official government sites
- Proper state detection (never empty, correctly identifies Central vs state schemes)
- Clean, readable text content without HTML artifacts
- Successful Supabase upserts without conflicts
- Comprehensive error handling and logging

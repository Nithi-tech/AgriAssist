# Government Schemes Page

This directory contains the Government Schemes page implementation, which displays welfare schemes scraped from myscheme.gov.in.

## 🌟 Features

- Scrapes welfare schemes from myscheme.gov.in
- Displays schemes in a responsive table/grid view
- Filter by state
- Search by scheme name, eligibility, or description
- Expandable scheme details
- Links to apply for schemes
- Weekly automated updates

## 📁 Files

```
.
├── scripts/
│   └── scrape_schemes.js     # Web scraper script
├── data/
│   └── welfare_schemes.json  # Scraped data
├── src/
│   └── components/
│       └── GovernmentSchemesTableNew.tsx  # Main component
└── .github/
    └── workflows/
        └── update_schemes.yml  # Automated update workflow
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Run the Scraper**
   ```bash
   node scripts/scrape_schemes.js
   ```
   This will:
   - Scrape welfare schemes from myscheme.gov.in
   - Save data to `data/welfare_schemes.json`
   - Create a scraping log in `data/scrape_log_[timestamp].json`

3. **View the Page**
   - Start the development server: `npm run dev`
   - Open `http://localhost:9005/government-schemes`

## 🔄 Automated Updates

The data is automatically updated weekly through a GitHub Action that:
1. Runs every Sunday at midnight
2. Scrapes fresh data
3. Creates a PR with the updates
4. Applies labels for easy identification

You can also trigger the update manually:
1. Go to Actions → "Update Welfare Schemes"
2. Click "Run workflow"

## 🛠️ Development

### Adding New Features

1. The component uses entirely local data from `welfare_schemes.json`
2. No database or API calls required
3. Modify `GovernmentSchemesTableNew.tsx` to add UI features
4. Update `scrape_schemes.js` to collect additional data fields

### Updating the Scraper

1. Edit `scripts/scrape_schemes.js`:
   - Adjust selectors if the website structure changes
   - Add new fields to scrape
   - Modify rate limiting or other settings

2. Testing the scraper:
   ```bash
   node scripts/scrape_schemes.js
   ```

### Component Structure

1. **Data Loading**: Imports JSON directly
2. **Filtering**: Client-side state and filter functions
3. **UI States**:
   - Table/Grid view toggle
   - Expandable descriptions
   - Loading & empty states
   - Sort functionality
4. **Responsive Design**: Mobile-first with Tailwind CSS

## 🔍 Troubleshooting

1. **Scraper Issues**:
   - Check the scraping logs in `data/scrape_log_*.json`
   - Verify website structure hasn't changed
   - Ensure rate limiting is respected

2. **Display Issues**:
   - Validate JSON structure
   - Check browser console for errors
   - Verify all required fields are present

3. **Automated Update Failures**:
   - Check GitHub Actions logs
   - Verify GitHub token permissions
   - Test scraper locally

## 📝 Notes

- Respects robots.txt and rate limits
- Deduplicates schemes based on name + state
- Includes source URLs for verification
- No database/API dependencies

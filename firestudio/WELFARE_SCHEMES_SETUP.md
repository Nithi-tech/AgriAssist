# Government Welfare Schemes Integration Guide

## 🎯 Complete Setup Instructions

### 1. Database Setup in Supabase

1. **Login to your Supabase dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor** in your project
3. **Execute the table creation script**:
   ```sql
   -- Copy and paste the entire content from: sql/create_welfare_schemes_table.sql
   ```

### 2. Environment Variables

Ensure your `.env.local` file has these variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Data Import Options

#### Option A: Using the Import Script (Recommended)
```bash
# 1. Ensure you have the sample data
# File: data/welfare_schemes_sample.csv is already created

# 2. Run the import script
node scripts/importWelfareSchemes.js data/welfare_schemes_sample.csv --clear

# The --clear flag will remove existing data before importing
```

#### Option B: Manual CSV Import in Supabase
1. Go to Supabase Dashboard > Table Editor
2. Select `welfare_schemes` table
3. Click "Insert" > "Import data from CSV"
4. Upload the `data/welfare_schemes_sample.csv` file

### 4. Testing the Integration

1. **Start your development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Visit the Government Schemes page**:
   ```
   http://localhost:9004/govt-schemes
   ```

3. **Expected Features**:
   - ✅ Statistics cards showing scheme counts
   - ✅ Search functionality (title, description, implementing agency)
   - ✅ Filter by State (All, Central Government, Tamil Nadu, Assam)
   - ✅ Filter by Category (All, Agriculture, Education, Health, Housing, Business)
   - ✅ Responsive scheme cards with all details
   - ✅ Benefit amount formatting
   - ✅ Launch year display
   - ✅ Target beneficiaries information

## 🛠️ Available Functions

The `src/lib/supabaseWelfareClient.js` provides these functions:

- `getAllWelfareSchemes()` - Get all schemes
- `searchWelfareSchemes(query)` - Full-text search
- `getFilteredWelfareSchemes(filters)` - Advanced filtering
- `getWelfareSchemeById(id)` - Get single scheme
- `createWelfareScheme(schemeData)` - Add new scheme
- `updateWelfareScheme(id, updates)` - Update existing scheme
- `deleteWelfareScheme(id)` - Remove scheme
- `getSchemesByState(state)` - Filter by state
- `getSchemesByCategory(category)` - Filter by category
- `getWelfareSchemeStats()` - Get statistics
- `batchCreateWelfareSchemes(schemes)` - Bulk import

## 🎨 Component Structure

- **WelfareSchemesBrowser.tsx**: Main component with filtering and display
- **Government Schemes Page**: Located at `/govt-schemes`
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Filtering**: Instant search and filter results

## 📊 Sample Data Structure

The sample CSV includes 15 diverse schemes:
- **Central Government**: PM-KISAN, PMAY-G, Ayushman Bharat, etc.
- **Tamil Nadu**: Amma Canteen, Free Laptop Scheme, etc.
- **Assam**: Chief Minister's Relief Fund, MMUA, etc.
- **Categories**: Agriculture, Education, Health, Housing, Business

## 🔍 Troubleshooting

### Common Issues:

1. **"No schemes found"**: Check if data was imported successfully
2. **Supabase connection errors**: Verify environment variables
3. **RLS errors**: Ensure policies are enabled (created automatically)
4. **Search not working**: Check full-text search index creation

### Debug Steps:

1. Check browser console for errors
2. Verify Supabase table has data:
   ```sql
   SELECT COUNT(*) FROM welfare_schemes;
   ```
3. Test API connection:
   ```javascript
   // In browser console on your site:
   import { getAllWelfareSchemes } from './src/lib/supabaseWelfareClient';
   getAllWelfareSchemes().then(console.log);
   ```

## 🚀 Next Steps

1. **Execute the SQL script** in Supabase
2. **Import the sample data** using the script or manual upload
3. **Test the integration** at `/govt-schemes`
4. **Customize** the data with your actual PDF content
5. **Extend** with additional features as needed

The complete welfare schemes system is now ready for integration!

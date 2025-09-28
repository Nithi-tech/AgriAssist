# 🚀 **Government Schemes Import & Frontend Setup**

## **📊 Complete Setup Guide**

### **Step 1: Database Setup**
1. **Run the SQL schema** in your Supabase SQL Editor:
   ```bash
   # Copy and paste the contents of scripts/schema.sql into Supabase SQL Editor
   ```

2. **Verify your .env.local file** (in the main project root):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### **Step 2: Import CSV Data**
1. **Navigate to scripts directory**:
   ```bash
   cd scripts
   npm install
   ```

2. **Run the import script**:
   ```bash
   npm run import:schemes
   ```

3. **Expected output**:
   ```
   🚀 Starting Government Schemes Import...
   🗑️  Clearing existing agricultural_policies data...
   ✅ Successfully cleared existing data
   📄 Reading CSV file: C:\Users\nithi\OneDrive\Documents\Copy of POLICES_FINAL(1).csv
   📊 Raw CSV rows: 1500
   ✅ Processed 1450 valid records (50 skipped)
   💾 Inserting 1450 records into Supabase...
   ✅ Successfully inserted: 1450
   📊 INSERTION SUMMARY:
   ✅ Successfully inserted: 1450
   ❌ Failed insertions: 0
   📈 Success rate: 100.0%
   🔍 Verifying import...
   ✅ Verification complete: 1450 total records in database
   🎊 Government Schemes Import Completed Successfully!
   ```

### **Step 3: Test the Frontend**
1. **Start your Next.js app**:
   ```bash
   cd .. # Go back to main project directory
   npm run dev
   ```

2. **Visit the Government Schemes page**:
   ```
   http://localhost:3000/government-schemes
   ```

---

## **🔧 What Each File Does**

### **📁 Import Scripts**
- `importGovernmentSchemes.ts` - Main import script with CSV parsing and data cleaning
- `schema.sql` - Database schema and indexes
- `package.json` - Dependencies for import scripts

### **⚛️ React Components**
- `SchemesList.tsx` - Main component that displays filtered schemes
- `government-schemes/page.tsx` - Page wrapper with stats and user info

### **🎯 Key Features**

#### **Import Script Features:**
- ✅ **CSV Parsing**: Handles different column name formats
- ✅ **Data Cleaning**: Trims whitespace, normalizes text
- ✅ **Deduplication**: Prevents duplicate state+scheme combinations
- ✅ **Validation**: Skips empty or invalid records
- ✅ **Batch Processing**: Inserts data in optimized batches
- ✅ **Error Handling**: Individual row retry on failures
- ✅ **Verification**: Confirms successful import

#### **Frontend Features:**
- ✅ **State Filtering**: Filter schemes by user's state
- ✅ **Search**: Search by scheme name, description, or eligibility
- ✅ **Eligibility Check**: Basic eligibility validation based on user profile
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **External Links**: Direct links to government application pages

---

## **🐛 Troubleshooting**

### **Common Issues:**

#### **1. CSV File Not Found**
```bash
Error: CSV file not found: C:\Users\nithi\OneDrive\Documents\Copy of POLICES_FINAL(1).csv
```
**Solution**: Update the file path in `importGovernmentSchemes.ts` line 38:
```typescript
this.csvFilePath = path.join('C:', 'Users', 'nithi', 'OneDrive', 'Documents', 'Copy of POLICES_FINAL(1).csv');
```

#### **2. Supabase Connection Error**
```bash
Error: Missing Supabase credentials
```
**Solution**: Check your `.env.local` file has the correct Supabase URL and key.

#### **3. Database Permission Error**
```bash
Error: new row violates row-level security policy
```
**Solution**: Run the `schema.sql` file to set up proper RLS policies.

#### **4. Frontend Component Not Found**
```bash
Error: Cannot resolve '@/components/SchemesList'
```
**Solution**: Make sure the component is in the correct path and restart your dev server.

### **Debug Mode:**
Add this to see detailed parsing logs:
```typescript
// In importGovernmentSchemes.ts, line 25
const DEBUG = true;
```

---

## **📈 Expected Results**

### **Database:**
- Table: `agricultural_policies`
- Records: ~1400-1500 government schemes
- States: All Indian states and union territories
- Data: Clean, deduplicated agricultural policies

### **Frontend:**
- **Search**: Type "subsidy" to find all subsidy schemes
- **Filter**: Select "Karnataka" to see Karnataka-specific schemes
- **Eligibility**: Toggle "Eligible Only" to see schemes matching user profile
- **Links**: Click "Apply" buttons to visit government websites

### **User Experience:**
1. User sees schemes relevant to their state
2. Can search and filter schemes easily
3. Gets eligibility indication based on profile
4. Can directly apply through government links

---

## **🚀 Next Steps**

1. **Run the import script** to load your CSV data
2. **Test the frontend** to ensure everything works
3. **Customize user profiles** based on your authentication system
4. **Add more filtering options** (crop type, income bracket, etc.)
5. **Set up periodic imports** to keep data updated

**Ready to launch your Government Schemes feature!** 🎯

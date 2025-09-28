# 🚀 **CSV to Supabase Import Script**

## **Quick Setup Guide**

### **Step 1: Install Dependencies**
```bash
cd scripts
npm install
```

### **Step 2: Configure Environment**
Update the `.env` file with your Supabase credentials:

```bash
# Required: Your Supabase project details
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Step 3: Prepare Your CSV File**
- Place your `POLICES_FINAL.csv` file in the correct location
- Update the file path in `importPolicies.ts` (line ~159):
```typescript
const csvFilePath = path.join(process.cwd(), 'path', 'to', 'your', 'POLICES_FINAL.csv');
```

### **Step 4: Run the Import**
```bash
npm run import
```

## **What This Script Does**

### ✅ **Data Cleaning & Validation**
- Removes empty rows and invalid entries
- Trims whitespace and normalizes text
- Handles state-based CSV structure
- Limits text length to prevent database overflow

### ✅ **Database Operations**
- Clears existing `agricultural_policies` table
- Inserts data in optimized batches (50 records per batch)
- Provides detailed logging and error handling
- Verifies successful insertion

### ✅ **Error Handling**
- Individual row retry on batch failures
- Comprehensive error logging
- Success rate reporting
- Database verification

## **Expected CSV Structure**

The script expects a CSV with this pattern:
```
STATE_NAME
SCHEME,EXPLANATION,ELIGIBILITY_CRITERIA,LINK
Scheme Name 1,Description...,Criteria...,https://...
Scheme Name 2,Description...,Criteria...,https://...

ANOTHER_STATE
SCHEME,EXPLANATION,ELIGIBILITY_CRITERIA,LINK
Scheme Name 3,Description...,Criteria...,https://...
```

## **Database Schema**

Target table: `agricultural_policies`
```sql
CREATE TABLE agricultural_policies (
  id SERIAL PRIMARY KEY,
  state TEXT NOT NULL,
  scheme_name TEXT NOT NULL,
  explanation TEXT,
  eligibility_criteria TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## **Troubleshooting**

### **Common Issues:**

1. **File not found**: Update the `csvFilePath` in the script
2. **Supabase connection**: Verify your `.env` credentials
3. **Permission denied**: Use service role key for delete operations
4. **Large file**: The script handles batching automatically

### **Debug Mode:**
The script provides detailed console output showing:
- States being processed
- Policies being added
- Batch insertion progress
- Final success statistics

---

**Ready to import? Run `npm run import` in the scripts directory!** 🎯

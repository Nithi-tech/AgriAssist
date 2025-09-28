# 🚀 **Quick Database Setup**

## **Step 1: Run SQL in Supabase**

1. **Go to your Supabase Dashboard**
2. **Open SQL Editor** (Database → SQL Editor)
3. **Copy and paste** the contents of `simple_schema.sql`
4. **Click RUN** to execute the SQL

## **Step 2: Run the Import**

```bash
cd scripts
npm run import:state-based
```

## **Step 3: Test the Frontend**

1. **Start the server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Visit the Government Schemes page**:
   ```
   http://localhost:9005/government-schemes
   ```

---

## **🎯 What You Should See**

### **After SQL Setup:**
- Table `agricultural_policies` created
- Permissions set for data import
- RLS disabled for import process

### **After Import:**
- ~60 government schemes loaded
- Data organized by state
- Clean, deduplicated records

### **Frontend Features:**
- ✅ Search schemes by name
- ✅ Filter by state (dropdown)
- ✅ User eligibility indicators
- ✅ Direct application links
- ✅ Responsive design

---

**Ready to import your government schemes data!** 🌾

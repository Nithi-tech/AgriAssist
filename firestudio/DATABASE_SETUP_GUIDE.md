# 🗄️ Fire Studio Database Setup Instructions

## **COMPLETE STEP-BY-STEP GUIDE**

### **📋 Prerequisites**
- ✅ Supabase project created: `https://hreptuxylrsqhqnpfwez.supabase.co`
- ✅ Environment variables configured in `.env.local`
- ✅ Project running locally

---

## **🚀 DATABASE SETUP PROCESS**

### **STEP 1: Access Supabase Dashboard**
1. Open: https://supabase.com/dashboard/project/hreptuxylrsqhqnpfwez
2. Navigate to: **SQL Editor** 
3. Click: **New Query**

### **STEP 2: Execute SQL Files (IN ORDER)**

⚠️  **IMPORTANT: Execute these files in the EXACT order shown below**

#### **2.1 Backup Current Data (Optional)**
```sql
-- Copy contents of: sql/01_backup_data.sql
-- Paste in SQL Editor and run
```

#### **2.2 Reset Database (DESTRUCTIVE)**  
```sql
-- Copy contents of: sql/02_reset_database.sql
-- ⚠️  This will DELETE ALL existing data
-- Paste in SQL Editor and run
```

#### **2.3 Create Market Prices Table**
```sql
-- Copy contents of: sql/03_create_market_prices.sql
-- Paste in SQL Editor and run
```

#### **2.4 Create Welfare Schemes Table**
```sql
-- Copy contents of: sql/04_create_welfare_schemes.sql  
-- Paste in SQL Editor and run
```

#### **2.5 Create User Authentication Tables**
```sql
-- Copy contents of: sql/05_create_user_auth.sql
-- Paste in SQL Editor and run  
```

#### **2.6 Create Crops Management Table**
```sql
-- Copy contents of: sql/06_create_crops.sql
-- Paste in SQL Editor and run
```

#### **2.7 Seed Sample Data**
```sql
-- Copy contents of: sql/07_seed_sample_data.sql
-- Paste in SQL Editor and run
```

---

## **✅ VERIFICATION STEPS**

### **STEP 3: Test Database Connection**
```bash
# In your project directory:
cd c:\Users\nithi\firestudio\firestudio
npm run db:test
```

Expected output:
```
🧪 Testing Fire Studio Database Connections...

1️⃣  Testing basic Supabase connection...
✅ Basic connection successful

2️⃣  Testing market_prices table...
✅ Market prices table accessible, 10 sample records found

3️⃣  Testing welfare_schemes table...
✅ Welfare schemes table accessible, 5 sample records found

📊 Results: 6 passed, 0 failed
🎉 All tests passed! Database is ready for Fire Studio.
```

### **STEP 4: Start Application**
```bash
npm run dev
```

### **STEP 5: Test Frontend Connections**

#### **Test Market Prices API:**
- Open: http://localhost:9005/market-prices
- Should show real data instead of demo data
- Check charts and filters work

#### **Test Government Schemes:**
- Open: http://localhost:9005/govt-schemes
- Should show 5+ welfare schemes
- Test search and filtering

#### **Test Crop Management:**
- Open: http://localhost:9005/my-crop
- Should load without errors
- (Data will appear after user authentication)

---

## **🛡️ SECURITY VERIFICATION**

### **STEP 6: Verify Row Level Security**

In Supabase Dashboard → Authentication → Policies:
- ✅ `market_prices`: Public read, Admin write
- ✅ `welfare_schemes`: Public read active schemes
- ✅ `crops`: Users see only their own crops  
- ✅ `user_profiles`: Users see only their own profile

### **STEP 7: Verify Performance**

In Supabase Dashboard → Database → Tables:
- ✅ All tables have proper indexes
- ✅ `latest_market_prices` materialized view exists
- ✅ Triggers for `updated_at` columns active

---

## **🔧 TROUBLESHOOTING**

### **Common Issues:**

#### **❌ "relation does not exist"**
**Solution:** Make sure you ran SQL files in correct order

#### **❌ "permission denied for table"**
**Solution:** Check RLS policies are created correctly

#### **❌ "function does not exist"**  
**Solution:** Re-run the SQL file that creates the function

#### **❌ Connection timeout**
**Solution:** Check environment variables in `.env.local`

### **Reset Everything:**
```sql
-- In Supabase SQL Editor, run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run all SQL files from step 2.3 onward
```

---

## **📊 DATABASE ARCHITECTURE CONFIRMATION**

After successful setup, your database will have:

### **🏗️ Tables Created:**
1. **`market_prices`** - Real-time commodity prices (10 sample records)
2. **`welfare_schemes`** - Government schemes (5 sample records)  
3. **`user_profiles`** - Extended user data
4. **`crops`** - Farmer crop tracking
5. **`crop_logs`** - Crop activity logs
6. **`otp_codes`** - Phone authentication

### **⚡ Performance Features:**
- **Indexes**: State, commodity, date-based queries optimized
- **Materialized View**: `latest_market_prices` for fast latest price queries
- **Triggers**: Auto-update `updated_at` timestamps
- **Full-text Search**: On welfare schemes descriptions

### **🛡️ Security Features:**
- **RLS Enabled**: All tables have row-level security
- **User Isolation**: Farmers see only their own crops
- **Admin Access**: Special policies for admin users
- **Public Data**: Market prices and welfare schemes publicly readable

### **🔄 Real-time Features:**
- **Subscriptions**: Live updates for market price changes
- **Materialized View Refresh**: Automated latest price updates
- **Connection Pooling**: Optimized for high concurrency

---

## **🎯 FINAL VERIFICATION**

✅ **Database Schema**: All 6 tables created with proper structure  
✅ **Sample Data**: Market prices, welfare schemes populated  
✅ **Security Policies**: RLS working for user isolation  
✅ **Performance**: Indexes and materialized views active  
✅ **Frontend Integration**: APIs connecting to real database  
✅ **Real-time Updates**: Subscriptions working  

**🎉 Your Fire Studio database is now production-ready!**

---

## **🚀 Next Steps**

1. **Test all features** in the frontend application
2. **Set up cron jobs** for automated data updates  
3. **Configure backup strategy** for production
4. **Monitor performance** with Supabase dashboard
5. **Scale resources** as user base grows

For support: Check Supabase logs in Dashboard → Logs

# Supabase Setup Guide

## Step 1: Get Supabase Credentials

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard/projects
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:

### From the API Settings page:
- **Project URL** → Copy this as `NEXT_PUBLIC_SUPABASE_URL`
- **Service Role Key** (secret) → Copy this as `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Update .env.local file

Replace these lines in your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

With your actual values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Fix Database Issues

If you encounter RLS (Row Level Security) errors, run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Temporarily disable RLS to allow service role access
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;
```

## Step 4: Restart Development Server

After updating the environment variables:
```bash
npm run dev
```

## Important Notes:
- Never commit your actual `.env.local` file to version control
- The service role key has admin access - keep it secure
- RLS policies can be re-enabled later with proper user authentication

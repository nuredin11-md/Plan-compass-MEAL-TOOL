# Supabase Setup Verification Guide

## Quick Checklist

Follow these steps to verify your Supabase database is correctly configured:

### 1. Verify Environment Variables ✓
**File:** `.env.local`
```
VITE_SUPABASE_URL=https://lnupjvigwccpoyookrvg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0477GupnbdKDmpLYIOjZPw_VjH_jb9z
```

### 2. Check Database Migrations in Supabase Console

Go to: **https://app.supabase.com** → Select your project → **SQL Editor**

**Required Tables & Columns:**

#### `profiles` table
```sql
- id (UUID, auto-generated)
- user_id (UUID, references auth.users)
- display_name (TEXT)
- department (TEXT/ENUM)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `user_roles` table
```sql
- id (UUID, auto-generated)
- user_id (UUID, references auth.users)
- role (app_role ENUM: admin, department_head, data_entry, viewer)
```

#### `annual_plans` table
```sql
- id (UUID)
- year (INTEGER)
- indicator_code (TEXT)
- program_area (TEXT)
- target (NUMERIC)
- created_by (UUID)
- created_at, updated_at (TIMESTAMP)
```

#### `monthly_data` table
```sql
- id (UUID)
- year (INTEGER)
- month (INTEGER 1-12)
- indicator_code (TEXT)
- actual (NUMERIC)
- entered_by (UUID)
- created_at, updated_at (TIMESTAMP)
```

### 3. Apply Migrations

If tables are missing, run the migrations in Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy & paste content from: `supabase/migrations/20260214065929_38de4528-070d-460d-a834-129f01579a73.sql`
4. Click **Run**
5. Repeat for any other migration files if needed

### 4. Verify Row Level Security (RLS)

In **Authentication** → **Policies**, verify these exist:

**profiles table:**
- ✓ "Users can view own profile"
- ✓ "Admins can view all profiles"
- ✓ "Users can update own profile"

**user_roles table:**
- ✓ "Users can view own roles"
- ✓ "Admins can manage roles"

**If RLS is enabled but policies are missing:**
1. Disable RLS temporarily: `ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`
2. Re-run the migration to add policies
3. Re-enable: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`

### 5. Test Authentication

#### Test Sign Up:
```
Email: test@hospital.local
Password: TempPassword123!
Display Name: Dr. Test
Department: Maternal & Child Health
```

#### Check if Profile Was Created:
In **SQL Editor**, run:
```sql
SELECT * FROM public.profiles WHERE display_name = 'Dr. Test';
SELECT * FROM public.user_roles WHERE id IN (
  SELECT id FROM public.profiles WHERE display_name = 'Dr. Test'
);
```

### 6. Enable Auth Email Confirmation (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize confirmation email template
3. Enable email verification in **Authentication** → **Providers** → **Email**

---

## Troubleshooting

### Issue: "Supabase is not configured" error
**Solution:** Verify `.env.local` has correct URL and key values

### Issue: Sign up succeeds but profile not created
**Solution:** Check if the trigger `on_auth_user_created` exists:
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```
If missing, re-run migration: `20260214065929_38de4528-070d-460d-a834-129f01579a73.sql`

### Issue: Can't read user profile after login
**Solution:** Check RLS policies on profiles table:
```sql
SELECT * FROM auth.uid(); -- Should return current user UUID
```

Then test policy:
```sql
SELECT * FROM public.profiles WHERE user_id = auth.uid();
```

### Issue: Department dropdown shows no options
**Solution:** Check if department ENUM type exists:
```sql
SELECT enum_range(NULL::public.department);
```

If missing, recreate it:
```sql
CREATE TYPE public.department AS ENUM (
  'Maternal & Child Health', 'Child Health', 'Nutrition', 
  'HIV/AIDS & STI', 'Tuberculosis', 'Malaria', 'WASH', 'NCD', 
  'Health System Strengthening'
);
```

---

## Database Schema Diagram

```
auth.users (Supabase managed)
    ↓
    ├→ profiles (user_id → auth.users.id)
    │   ├ id, user_id, display_name, department, created_at, updated_at
    │
    ├→ user_roles (user_id → auth.users.id)
    │   ├ id, user_id, role
    │
    ├→ annual_plans (created_by → auth.users.id)
    │   ├ id, year, indicator_code, program_area, target, created_by, created_at
    │
    └→ monthly_data (entered_by → auth.users.id)
        ├ id, year, month, indicator_code, actual, entered_by, created_at
```

---

## Next Steps

✅ Once verified, authentication should work correctly
- Users will be auto-created in `profiles` table on signup (via trigger)
- Users will be assigned default "viewer" role
- Login/signup forms should display user info correctly

Need help? Check browser console for detailed error messages.

# Hospital Plan Compass - Supabase Data Integration Testing Guide

## Summary of Recent Improvements

### 1. IPC FLAT Assessment Supabase Integration ✅
- **New Hook**: `src/hooks/useIPCAssessment.ts` - Handles cloud persistence for IPC assessments
- **Enhanced Component**: `src/components/ipc/ScoreDashboard.tsx` - Added "Save Draft" and "Submit Audit" buttons
- **Benefits**:
  - IPC FLAT assessments now persist to Supabase `ipc_assessments` table
  - Automatic fallback to localStorage if table doesn't exist
  - User feedback on save/submit status
  - Graceful error handling with user-friendly messages

### 2. MasterPlanTab Data Debugging ✅
- **New Diagnostic Script**: `src/lib/debugDataFetch.ts`
- **Enhanced Logging**: Better error messages in MasterPlanTab.tsx
- **Functions**:
  - Test Supabase client initialization
  - Verify authentication status
  - Direct table query validation
  - Function-level fetch testing with filters

### 3. Hospital Data Checklist
- **Status**: ✅ Already integrated via AssessmentWizard component
- **Location**: `src/components/assessment/AssessmentWizard.tsx`
- **Supabase Tables**: Uses `facilities`, `assessments`, `responses` tables
- **Note**: Requires proper Supabase schema setup (see schema migrations)

---

## How to Test Data Integration

### Step 1: Run the App
```bash
npm run dev
```

The app will start on `http://localhost:3002` (or fallback port if 3002 is in use).

### Step 2: Test IPC FLAT Assessment Persistence
1. Navigate to **Facility Assessment Workspace** → **IPC FLAT Assessment** tab
2. Fill in Hospital Profile information
3. Answer assessment questions (Steps 1-2)
4. On Step 4 (Results & Analytics):
   - Click **"Save Draft"** button
   - Check browser console for success message
   - Click **"Submit Audit"** button for final submission
5. **Expected**: Toast notification saying "Assessment saved/submitted successfully!"
6. **If offline**: "Assessment saved locally only" message (falls back to localStorage)

### Step 3: Test MasterPlanTab Data Loading
1. Navigate to **Master Plan** tab
2. Open browser DevTools (F12) → Console
3. Look for logs starting with `[MasterPlanTab]`:
   - `[MasterPlanTab] Fetching hospital performance data for year: XXXX`
   - `[MasterPlanTab] Received N performance rows from Supabase`
4. Verify that:
   - Rows appear in the performance grid
   - Data matches what's in Supabase database
   - Status indicators (green/yellow/red) display correctly

### Step 4: Run the Diagnostic Script
In browser console, run:
```javascript
// Import and run the debug function
import { debugHospitalPerformanceData } from '/src/lib/debugDataFetch.ts';
await debugHospitalPerformanceData();
```

This will output:
- ✓ Supabase client status
- ✓ Authentication status
- ✓ Direct table query results
- ✓ Function test results
- ✓ Filtered query results

### Step 5: Test Hospital Data Checklist
1. Navigate to **Facility Assessment Workspace** → **Hospital Data Checklist** tab (AssessmentWizard)
2. Fill in facility information
3. Answer assessment sections
4. Click "Save" or "Submit"
5. **Expected**: Data saved to Supabase `assessments` table with `responses` records

---

## Database Tables Required

### For IPC FLAT Assessment
```sql
CREATE TABLE ipc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name VARCHAR(255),
  hospital_location VARCHAR(255),
  assessment_date DATE,
  assessor_names TEXT,
  total_score INTEGER,
  score_percentage DECIMAL(5,2),
  section_i_score DECIMAL(5,2),
  section_ii_score DECIMAL(5,2),
  responses JSONB,
  hospital_profile JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ipc_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON ipc_assessments FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create assessments"
  ON ipc_assessments FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
```

### For Hospital Data Checklist (Assessment Wizard)
```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  region VARCHAR(255),
  zone VARCHAR(255),
  woreda VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  assessment_date DATE,
  quarter VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  total_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id),
  item_id VARCHAR(255),
  score_achieved INTEGER,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### For Master Plan Data
The `hospital_plan_and_performance` table should already exist from migration `20260522_hospital_plan_performance.sql`. Verify it has:
- ✓ `category` column
- ✓ `indicator_name` column
- ✓ `fiscal_year` column (format: "2024 EFY")
- ✓ `metric_type` column ("Plan", "Performance", "EAP", "Actual")
- ✓ `metric_value` column (DECIMAL)
- ✓ RLS policies enabled

---

## Troubleshooting

### Problem: MasterPlanTab shows blank tables
**Diagnosis**:
1. Open console and check for `[MasterPlanTab]` logs
2. Run the diagnostic script: `await debugHospitalPerformanceData()`
3. Check if data exists in Supabase dashboard: `hospital_plan_and_performance` table

**Solutions**:
- Verify `hospital_plan_and_performance` table exists and has data
- Check RLS policies allow authenticated SELECT
- Confirm user is authenticated (check `useAuth()` hook)
- Run `fetch()` manually in console to test Supabase client

### Problem: IPC Assessment not saving to Supabase
**Diagnosis**:
1. Check browser console for error messages
2. Verify user is authenticated
3. Confirm `ipc_assessments` table exists in Supabase

**Solutions**:
- Create `ipc_assessments` table using SQL above
- Check RLS policies - user must have create/insert permissions
- Fall back to localStorage (visible in `window.localStorage`)

### Problem: IPC Assessment saving but not visible in Supabase
**Possible Causes**:
- Table doesn't exist (error is caught silently, saves to localStorage)
- RLS policy restricting access to current user's records
- User ID mismatch in RLS policy

**Solution**: Check Supabase logs and RLS policies

---

## Key Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useIPCAssessment.ts` | NEW - Cloud persistence hook |
| `src/lib/debugDataFetch.ts` | NEW - Diagnostic script |
| `src/components/ipc/ScoreDashboard.tsx` | Added Save/Submit buttons |
| `src/components/MasterPlanTab.tsx` | Enhanced logging |
| `src/hooks/useDatabase.tsx` | Already has fetchHospitalPerformanceData |
| `src/lib/hospitalPerformanceIntegration.ts` | Fetch logic for performance data |

---

## Next Steps

1. **Test all three assessment features**:
   - [ ] IPC FLAT Assessment saves to Supabase
   - [ ] Hospital Data Checklist saves to Supabase  
   - [ ] Master Plan displays data from Supabase

2. **Create missing tables** (if needed):
   - [ ] `ipc_assessments`
   - [ ] `facilities` (if not exists)
   - [ ] `assessments` (if not exists)
   - [ ] `responses` (if not exists)

3. **Verify RLS policies** allow proper access

4. **Monitor console logs** during testing for any errors

5. **Test offline fallback** by disabling network and verifying localStorage saves

---

## Database Connection Info

- **Supabase Project**: `https://lnupjvigwccpoyookrvg.supabase.co`
- **Environment Variables**: `.env.local` (not committed to git)
- **Auth Method**: Supabase Auth (Email/Password or OAuth)
- **RLS**: Enabled on all tables

---

*Last Updated: 2026-05-31*

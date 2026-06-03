# Firebase to Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely remove Firebase and migrate all Auth, Database, and Functionality to Supabase.

**Architecture:** We will replace Firestore with a relational PostgreSQL schema, Firebase Auth with Supabase Auth, and Firebase Functions with Postgres RPCs/Triggers. The Zustand store will be refactored to handle Supabase Realtime.

**Tech Stack:** Supabase (@supabase/supabase-js), PostgreSQL, Zustand, React.

---

### Task 1: Supabase Setup & Client Initialization

**Files:**
- Modify: `package.json`
- Create: `src/supabase.ts`

- [ ] **Step 1: Install Supabase client**
Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Create Supabase client utility**
Use existing Vercel environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Commit**
```bash
git add package.json src/supabase.ts
git commit -m "chore: add supabase client setup"
```

---

### Task 2: Database Schema & Logic (PostgreSQL)

**Files:**
- Create: `supabase/migrations/20260603_initial_schema.sql` (or run in Supabase SQL Editor)

- [ ] **Step 1: Define Enums and Tables**
Implement the schema defined in the spec, including `profiles`, `patients`, `appointments`, `financial_records`, `inventory_items`, and `audit_logs`.

- [ ] **Step 2: Implement Appointment Conflict RPC**
```sql
CREATE OR REPLACE FUNCTION create_appointment(
  p_patient_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_doctor_name text,
  p_date date,
  p_time time,
  p_procedure_type text,
  p_status text,
  p_notes text,
  p_quick_notes text
) RETURNS jsonb AS $$
DECLARE
  v_conflict_id uuid;
BEGIN
  SELECT id INTO v_conflict_id
  FROM appointments
  WHERE doctor_name = p_doctor_name
    AND date = p_date
    AND time = p_time
    AND status IN ('Scheduled', 'Waiting', 'In Chair')
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Double booking conflict detected.');
  END IF;

  INSERT INTO appointments (
    patient_id, patient_name, patient_phone, doctor_name, date, time, procedure_type, status, notes, quick_notes
  ) VALUES (
    p_patient_id, p_patient_name, p_patient_phone, p_doctor_name, p_date, p_time, p_procedure_type, p_status, p_notes, p_quick_notes
  ) RETURNING id INTO v_conflict_id;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_conflict_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 3: Setup Profile Trigger**
Create a trigger to automatically create a entry in `public.profiles` when a new user signs up in `auth.users`.

- [ ] **Step 4: Apply RLS Policies**
Enable RLS and restrict access to authenticated personnel as per spec.

---

### Task 3: Zustand Store Auth & Sync Refactor

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Replace Firebase Auth with Supabase Auth in `login`/`logout`**
Update `login` to use `supabase.auth.signInWithPassword` and `logout` to use `supabase.auth.signOut`.

- [ ] **Step 2: Implement Realtime Sync via Supabase Channels**
Refactor `startFirestoreSync` to `startSupabaseSync`. Use `supabase.channel()` to listen to `INSERT`, `UPDATE`, and `DELETE` on all tables and update state accordingly.

- [ ] **Step 3: Initial Hydration**
Fetch initial data for all tables during `startSupabaseSync`.

- [ ] **Step 4: Update `syncDoc` replacement**
Update internal persistence logic to use `supabase.from(table).upsert()` or `.delete()`.

---

### Task 4: Service & Component Refactor

**Files:**
- Modify: `src/api/backendClient.ts`
- Modify: `src/App.tsx`
- Modify: `src/services/*.ts`

- [ ] **Step 1: Refactor `backendClient.ts`**
Replace `httpsCallable` with `supabase.rpc()` calls or direct `supabase.from()` queries.

- [ ] **Step 2: Update `App.tsx` Auth Listener**
Replace `onAuthStateChanged` with `supabase.auth.onAuthStateChange`. Update the "Auto-register practitioner" logic to work with Supabase profiles.

- [ ] **Step 3: Update `src/services/` logic**
Ensure all services (`bookingService`, `financeService`, etc.) are pointing to the new `backendClient` or direct Supabase calls.

---

### Task 5: Firebase Cleanup

**Files:**
- Modify: `package.json`
- Delete: `src/firebase.ts`
- Delete: `functions/` (entire directory)
- Delete: `firebase-blueprint.json`, `firebase-applet-config.json`, `firestore.rules`

- [ ] **Step 1: Uninstall Firebase dependencies**
Run: `npm uninstall firebase firebase-tools firebase-admin firebase-functions`

- [ ] **Step 2: Delete Firebase configuration files**
Delete `src/firebase.ts` and all root Firebase files.

- [ ] **Step 3: Commit Cleanup**
```bash
git rm src/firebase.ts
git rm -r functions/
git commit -m "cleanup: remove all firebase dependencies and config"
```

---

### Task 6: Final Validation

- [ ] **Step 1: Run build**
Run: `npm run build`

- [ ] **Step 2: Manual Smoke Test**
Verify Login -> Dashboard -> Patient Creation -> Appointment Scheduling.
Check Audit logs in DB to ensure triggers are working.

- [ ] **Step 3: Commit Verification Results**
```bash
git commit --allow-empty -m "test: verify supabase migration successful"
```

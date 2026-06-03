# Spec: Firebase to Supabase Migration

This document specifies the complete removal of Firebase and implementation of Supabase as the unified backend for Zendenta ERP.

## 1. Database Schema (PostgreSQL)

We will migrate the NoSQL Firestore structure to a relational PostgreSQL schema.

### 1.1 Tables

#### `profiles`
Extends `auth.users` for clinic-specific metadata.
- `id`: `uuid` (Primary Key, references `auth.users.id`)
- `name`: `text` (not null)
- `username`: `text` (unique, not null)
- `role`: `user_role` enum ('admin', 'clinician', 'frontdesk')
- `role2`: `user_role` enum
- `is_active`: `boolean` (default true)
- `email`: `text`
- `phone`: `text`
- `avatar_url`: `text`
- `specialty`: `text`
- `assigned_room`: `text`
- `days`: `text[]`
- `hours`: `text`
- `gender`: `text`
- `doctor_id`: `text`
- `updated_at`: `timestamp with time zone` (default now())

#### `patients`
- `id`: `uuid` (Primary Key, default gen_random_uuid())
- `name`: `text` (not null)
- `phone`: `text` (not null)
- `whatsapp`: `text`
- `email`: `text`
- `dob`: `date`
- `gender`: `text`
- `ortho_notes`: `text`
- `created_at`: `timestamp with time zone` (default now())
- `filling_records`: `jsonb` (maintaining for complex nested data)
- `extraction_records`: `jsonb`
- `prosthetics_records`: `jsonb`
- `risk_level`: `text`
- `allergies`: `text`
- `weight`: `text`
- `height`: `text`
- `address`: `text`
- `occupation`: `text`
- `specialty_records`: `jsonb`
- `sessions`: `jsonb`
- `avatar_url`: `text`

#### `appointments`
- `id`: `uuid` (Primary Key, default gen_random_uuid())
- `patient_id`: `uuid` (references patients.id)
- `patient_name`: `text`
- `patient_phone`: `text`
- `doctor_name`: `text`
- `date`: `date` (not null)
- `time`: `time` (not null)
- `procedure_type`: `text`
- `status`: `text`
- `notes`: `text`
- `quick_notes`: `text`
- `attending_clinical_operator`: `text`
- `created_at`: `timestamp with time zone` (default now())

#### `financial_records`
- `id`: `uuid` (Primary Key, default gen_random_uuid())
- `patient_id`: `text` (UUID or 'N/A')
- `patient_name`: `text`
- `procedure_name`: `text`
- `total_cost`: `numeric`
- `paid_amount`: `numeric`
- `remaining_amount`: `numeric`
- `payment_status`: `text`
- `date`: `date`
- `payment_method`: `text`
- `receipt_no`: `text`
- `notes`: `text`
- `type`: `text` ('income', 'expense')
- `expense_category`: `text`
- `expense_type`: `text`
- `period_type`: `text`
- `doctor_id`: `text`
- `receipt_file_name`: `text`
- `receipt_file_content`: `text` (Will eventually migrate to Storage)

#### `inventory_items`
- `id`: `uuid` (Primary Key, default gen_random_uuid())
- `name`: `text` (not null)
- `quantity`: `numeric` (not null)
- `unit`: `text`
- `min_qty`: `numeric`
- `expiry_date`: `date`
- `batch_no`: `text`
- `suggested_first`: `boolean`
- `price_per_unit`: `numeric`

#### `audit_logs` (replaces `activityLogs`)
- `id`: `uuid` (Primary Key, default gen_random_uuid())
- `timestamp`: `timestamp with time zone` (default now())
- `actor_id`: `uuid` (references auth.users.id)
- `user_name`: `text`
- `action`: `text`
- `resource_type`: `text`
- `resource_id`: `text`
- `details`: `text`
- `metadata`: `jsonb`

### 1.2 Security (RLS)
- `profiles`: Users can read all profiles; only `admin` or self can update.
- `patients`, `appointments`, `financial_records`, `inventory_items`: Only authenticated personnel (`clinician`, `frontdesk`, `admin`) can read/write.
- `audit_logs`: Only `admin` can read.

## 2. Authentication Migration

### 2.1 Supabase Auth Implementation
- Replace `firebase/auth` with `@supabase/supabase-js` auth methods.
- Implement login flow in `src/store.ts`.
- Implement user profile synchronization via a Postgres trigger (`on auth.users insert`).

### 2.2 Legacy "Master Key" Support
- The legacy bypass `UQBPQl-j...` will be implemented as a specialized Postgres RPC function accessible only to authenticated users with a specific temporary claim, or validated against a vault secret.

## 3. Realtime & State Management

### 3.1 Zustand Refactor
- Update `startFirestoreSync` to `startSupabaseSync`.
- Use Supabase Realtime Channels (`INSERT`, `UPDATE`, `DELETE`) to update the local store.
- Use `supabase.from(table).select('*')` for initial hydration.

### 3.2 Offline Persistence
- Swap Firestore's local cache with a persistent browser strategy for the Supabase client (e.g., using `localStorage` or `IndexedDB` for the session and a custom caching layer for data if needed, or relying on Zustand's `persist` middleware).

## 4. Backend Logic Migration (RPC/Edge Functions)

### 4.1 createAppointment (Conflict Check)
- Move to a Postgres Function (RPC) that uses a transaction to check for existing `Scheduled` appointments at the same time before inserting.

### 4.2 Financial Auditing
- Implement auto-creation of `audit_logs` entries via DB Triggers on sensitive tables.

## 5. Deployment & Cleanup

### 5.1 Firebase Removal
- Uninstall `firebase`, `firebase-admin`, `firebase-functions`.
- Delete `src/firebase.ts`.
- Remove Firebase env vars from `.env` and Vercel.

### 5.2 Verification
- Automated build check.
- E2E testing of Login -> Dashboard -> Patient Creation -> Appointment Scheduling.

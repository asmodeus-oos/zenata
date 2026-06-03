# Design Spec: Supabase Migration for Zustand Store

**Date:** 2026-06-03
**Status:** Approved (Auto-Edit Mode)

## 1. Overview
Refactor `src/store.ts` to replace Firebase Authentication and Firestore Synchronization with Supabase Auth and Realtime.

## 2. Architecture
- **Supabase Client**: Use the existing `@supabase/supabase-js` client in `src/supabase.ts`.
- **Realtime Strategy**: Use Supabase Channels to subscribe to `postgres_changes` for multiple tables.
- **Hydration Strategy**: Fetch all initial data on `startSupabaseSync`.

## 3. Data Mapping
We need to map between the frontend's camelCase types and the database's snake_case tables/columns.

### Table Mapping
| Store Property | Supabase Table |
|----------------|----------------|
| `users` | `profiles` |
| `patients` | `patients` |
| `appointments` | `appointments` |
| `financialRecords`| `financial_records` |
| `inventory` | `inventory_items` |
| `activityLogs` | `audit_logs` |

### Column Key Mapping (Examples)
- `isActive` -> `is_active`
- `avatarUrl` -> `avatar_url`
- `patientId` -> `patient_id`
- `procedureName` -> `procedure_name`

## 4. Auth Implementation
- **Login**:
  1. Query `public.profiles` for `email` where `username = input`.
  2. If found, `supabase.auth.signInWithPassword({ email, password })`.
  3. Call `setCurrentUser` with the mapped profile data.
- **Logout**:
  1. `supabase.auth.signOut()`.
  2. `stopSupabaseSync()`.
  3. Reset state.

## 5. Sync Implementation
- **Outgoing (`syncDoc`)**:
  - Convert data to snake_case.
  - Map `collectionName` to `tableName`.
  - Use `supabase.from(table).upsert(data)`.
- **Incoming (`startSupabaseSync`)**:
  - Hydrate: `Promise.all` for selective fetching of all 6 tables.
  - Realtime: Single channel with multiple `.on('postgres_changes', ...)` listeners.
  - Update store incrementally on events (INSERT, UPDATE, DELETE).

## 6. Offline Simulation
- Keep the `offlineSimulated` flag.
- Supabase calls in `syncDoc` should check this flag and log/skip if offline is simulated.

## 7. Dependencies to Remove
- `firebase/auth`
- `firebase/firestore`
- `./firebase.ts` (imports within `store.ts`)

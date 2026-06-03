# Service & Component Supabase Migration Design

**Date:** 2026-06-03
**Topic:** Task 4: Service & Component Refactor (Firebase to Supabase)

## Overview
Refactor APIs, Domain Services, and the main App entry point to use Supabase instead of Firebase. This completes the migration of the communication layer.

## Architecture

### 1. Data Transformation Utilities (`src/api/utils.ts`)
Extracting transformation logic to ensure consistency:
- `toSnakeCase(obj)`: Converts camelCase keys to snake_case for Supabase inputs.
- `toCamelCase(obj)`: Converts snake_case keys to camelCase for application consumption.

### 2. Backend Client (`src/api/backendClient.ts`)
The `backendClient` serves as the primary abstraction for database operations.
- **Patients:** Direct `insert`/`update` on `patients` table.
- **Appointments:** 
    - `create`: Calls `create_appointment` RPC for conflict validation.
    - `update`: Direct `update` on `appointments` table.
- **Finance:** Mapping `LedgerEntry` to `financial_records` table.
- **Audit:** Mapping `AuditEvent` to `audit_logs` table.

### 3. Application Entry Point (`src/App.tsx`)
Refactoring Auth and Sync orchestration:
- **Auth Observer:** Use `supabase.auth.onAuthStateChange`.
- **User Profile Sync:** When a user is authenticated, retrieve or create their record in the `profiles` table.
- **Store Sync:** Update calls to use `startSupabaseSync()` and `stopSupabaseSync()`.

## Data Mapping

| Firebase Method | Supabase Target | Notes |
|-----------------|-----------------|-------|
| `createPatientRecord` | `patients` table (insert) | |
| `updatePatientRecord` | `patients` table (update) | |
| `createAppointment` | `create_appointment` RPC | Includes double-booking check |
| `updateAppointment` | `appointments` table (update) | |
| `createLedgerEntry` | `financial_records` table | |
| `adjustStock` | `audit_logs` table | Temporary mapping until movement table exists |
| `updateStaffRole` | `profiles` table | Updates `role` column |

## Security & Error Handling
- All Supabase calls will use a `handleResponse` helper to standardize error reporting.
- RLS policies in the database ensure that staff can only access data they are authorized for.

## Verification Plan
1. **Auth Flow:** Verify login correctly triggers `startSupabaseSync`.
2. **Patient Creation:** Verify new patients are correctly inserted into Supabase with snake_case mapping.
3. **Appointment Conflict:** Verify `create_appointment` RPC correctly rejects double bookings.
4. **Data Consistency:** Ensure camelCase is preserved throughout the frontend.
